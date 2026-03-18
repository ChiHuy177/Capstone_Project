using CapstoneProject.Server.Models.Pdf;
using CapstoneProject.Server.Models.Response;
using CapstoneProject.Server.Services.interfaces;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace CapstoneProject.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PdfController : ControllerBase
    {
        private readonly IPdfReaderService _pdfReaderService;
        private readonly ILogger<PdfController> _logger;
        private const int MAX_FILE_SIZE_MB = 10;

        public PdfController(
            IPdfReaderService pdfReaderService,
            ILogger<PdfController> logger)
        {
            _pdfReaderService = pdfReaderService;
            _logger = logger;
        }

        [HttpPost("upload")]
        [ProducesResponseType(typeof(ApiResponse<PdfExtractionResult>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> UploadPdf(IFormFile file)
        {
            try
            {
                // Validate: Kiểm tra file có tồn tại
                if (file == null || file.Length == 0)
                {
                    _logger.LogWarning("Upload thất bại: Không có file");
                    return BadRequest(ApiResponse<object>.Error(
                        "Vui lòng chọn file để upload",
                        400
                    ));
                }

                // Validate: Kiểm tra định dạng file
                if (!_pdfReaderService.IsValidPdfFile(file.FileName))
                {
                    _logger.LogWarning($"Upload thất bại: File không phải PDF - {file.FileName}");
                    return BadRequest(ApiResponse<object>.Error(
                        "Chỉ chấp nhận file PDF",
                        400
                    ));
                }

                // Validate: Kiểm tra kích thước file
                if (!_pdfReaderService.IsValidFileSize(file.Length, MAX_FILE_SIZE_MB))
                {
                    _logger.LogWarning($"Upload thất bại: File quá lớn - {file.Length} bytes");
                    return BadRequest(ApiResponse<object>.Error(
                        $"File quá lớn. Kích thước tối đa {MAX_FILE_SIZE_MB}MB",
                        400
                    ));
                }

                _logger.LogInformation($"Bắt đầu xử lý file: {file.FileName}");

                // Xử lý file
                using var stream = file.OpenReadStream();

                // Lấy thông tin PDF
                var pdfInfo = await _pdfReaderService.GetPdfInfoAsync(stream);

                // Trích xuất text
                var extractedText = await _pdfReaderService.ExtractTextFromPdfAsync(stream);

                // Tạo kết quả
                var result = new PdfExtractionResult
                {
                    FileName = file.FileName,
                    PdfInfo = pdfInfo,
                    ExtractedText = extractedText,
                    TextLength = extractedText.Length,
                    TextPreview = extractedText.Length > 500
                        ? extractedText.Substring(0, 500) + "..."
                        : extractedText
                };

                _logger.LogInformation($"Xử lý file thành công: {file.FileName}");

                return Ok(ApiResponse<PdfExtractionResult>.Success(
                    result,
                    "Đọc file PDF thành công",
                    200
                ));
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogError(ex, "Lỗi khi xử lý PDF");
                return BadRequest(ApiResponse<object>.Error(
                    ex.Message,
                    400
                ));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi không xác định khi xử lý PDF");
                return StatusCode(
                    StatusCodes.Status500InternalServerError,
                    ApiResponse<object>.Error(
                        "Đã xảy ra lỗi khi xử lý file. Vui lòng thử lại.",
                        500
                    )
                );
            }
        }

        [HttpPost("info")]
        [ProducesResponseType(typeof(ApiResponse<PdfInfo>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> GetPdfInfo(IFormFile file)
        {
            try
            {
                if (file == null || file.Length == 0)
                {
                    return BadRequest(ApiResponse<object>.Error(
                        "Vui lòng chọn file",
                        400
                    ));
                }

                if (!_pdfReaderService.IsValidPdfFile(file.FileName))
                {
                    return BadRequest(ApiResponse<object>.Error(
                        "Chỉ chấp nhận file PDF",
                        400
                    ));
                }

                using var stream = file.OpenReadStream();
                var pdfInfo = await _pdfReaderService.GetPdfInfoAsync(stream);

                return Ok(ApiResponse<PdfInfo>.Success(
                    pdfInfo,
                    "Lấy thông tin PDF thành công",
                    200
                ));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi lấy thông tin PDF");
                return BadRequest(ApiResponse<object>.Error(
                    ex.Message,
                    400
                ));
            }
        }
    }
}
