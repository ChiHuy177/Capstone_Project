using CapstoneProject.Server.Models.LangChain;
using CapstoneProject.Server.Models.Response;
using CapstoneProject.Server.Services.interfaces;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace CapstoneProject.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class LangChainController : ControllerBase
    {
        private readonly ILangChainService _langChainService;
        private readonly ILogger<LangChainController> _logger;

        public LangChainController(
            ILangChainService langChainService,
            ILogger<LangChainController> logger)
        {
            _langChainService = langChainService;
            _logger = logger;
        }

        [HttpGet("health")]
        public async Task<IActionResult> HealthCheck()
        {
            try
            {
                var isHealthy = await _langChainService.HealthCheckAsync();

                if (isHealthy)
                {
                    return Ok(ApiResponse<object>.Success(
                        new { status = "healthy", message = "Python service is running" }
                    ));
                }

                return Ok(ApiResponse<object>.Error(
                    "Python service is not responding"
                ));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking Python service health");
                return StatusCode(500, ApiResponse<object>.Error(
                    "Error checking service health"
                ));
            }
        }


        [HttpPost("upload")]
        [RequestSizeLimit(100_000_000)]
        public async Task<IActionResult> UploadPdf(
            IFormFile file,
            [FromQuery] int year = 2026)
        {
            try
            {
                if (file == null || file.Length == 0)
                {
                    return BadRequest(ApiResponse<object>.Error("File không được rỗng"));
                }

                var extension = Path.GetExtension(file.FileName).ToLower();
                if (extension != ".pdf")
                {
                    return BadRequest(ApiResponse<object>.Error("Chỉ chấp nhận file PDF"));
                }

                if (file.Length > 50 * 1024 * 1024)
                {
                    return BadRequest(ApiResponse<object>.Error("File quá lớn. Tối đa 50MB"));
                }

                if (year < 2020 || year > 2030)
                {
                    return BadRequest(ApiResponse<object>.Error("Năm không hợp lệ. Phải từ 2020-2030"));
                }

                _logger.LogInformation(
                    "Uploading PDF: {FileName}, Size: {Size} bytes, Year: {Year}",
                    file.FileName, file.Length, year);

                var result = await _langChainService.ProcessPdfAsync(file, year);

                if (result.Success)
                {
                    return Ok(ApiResponse<ProcessPdfResponse>.Success(
                        result,
                        $"PDF năm {year} đã được xử lý thành công"));
                }

                return BadRequest(ApiResponse<ProcessPdfResponse>.Error(result.Message));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error uploading PDF");
                return StatusCode(500, ApiResponse<object>.Error($"Lỗi xử lý file: {ex.Message}"));
            }
        }

        [HttpPost("search")]
        public async Task<IActionResult> Search([FromBody] SearchRequest request)
        {
            try
            {
                // Validate
                if (!ModelState.IsValid)
                {
                    return BadRequest(ApiResponse<object>.Error(
                        "Dữ liệu không hợp lệ"
                    ));
                }

                _logger.LogInformation("Searching with query: {Query}, TopK: {TopK}",
                    request.Query, request.TopK);

                // Search
                var result = await _langChainService.SearchDocumentsAsync(request);

                return Ok(ApiResponse<SearchResponse>.Success(
                    result,
                    $"Tìm thấy {result.Results.Count} kết quả"
                ));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error searching documents");
                return StatusCode(500, ApiResponse<object>.Error(
                    $"Lỗi tìm kiếm: {ex.Message}"
                ));
            }
        }
    }
}
