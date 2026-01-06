using CapstoneProject.Server.Models.Pdf;
using CapstoneProject.Server.Services.interfaces;
using System.Text;
using UglyToad.PdfPig;

namespace CapstoneProject.Server.Services.implementations
{
    public class PdfReaderService : IPdfReaderService
    {
        private readonly ILogger<PdfReaderService> _logger;
        public PdfReaderService(ILogger<PdfReaderService> logger)
        {
            _logger = logger;
        }
        public async Task<string> ExtractTextFromPdfAsync(Stream pdfStream)
        {
            try
            {
                _logger.LogInformation("Bắt đầu trích xuất text từ PDF");
                if (pdfStream.CanSeek)
                {
                    pdfStream.Position = 0;
                }

                using var document = PdfDocument.Open(pdfStream);
                var allText = new StringBuilder();

                _logger.LogInformation($"PDF có {document.NumberOfPages} trang");

                foreach (var page in document.GetPages())
                {
                    var pageText = page.Text;

                    if(!string.IsNullOrWhiteSpace(pageText))
                    {
                        allText.AppendLine($"=== Trang {page.Number} ===");
                        allText.AppendLine(pageText);
                        allText.AppendLine();
                    }
                }

                var extractedText = allText.ToString();
                _logger.LogInformation($"Trích xuất thành công {extractedText.Length} ký tự");

                return await Task.FromResult(extractedText);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi trích xuất text từ PDF");
                throw new InvalidOperationException("Không thể đọc file PDF. Vui lòng kiểm tra file có hợp lệ không.", ex);
            }
        }

        public async Task<PdfInfo> GetPdfInfoAsync(Stream pdfStream)
        {
            try
            {
                _logger.LogInformation("Lấy thông tin metadata PDF");

                // Reset stream position về đầu
                if (pdfStream.CanSeek)
                {
                    pdfStream.Position = 0;
                }

                using var document = PdfDocument.Open(pdfStream);

                var pdfInfo = new PdfInfo
                {
                    NumberOfPages = document.NumberOfPages,
                    Title = document.Information?.Title,
                    Author = document.Information?.Author,
                    CreationDate = document.Information?.CreationDate,
                    FileSize = pdfStream.Length
                };

                _logger.LogInformation($"Lấy thông tin PDF thành công: {pdfInfo.NumberOfPages} trang");

                return await Task.FromResult(pdfInfo);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi lấy thông tin PDF");
                throw new InvalidOperationException("Không thể đọc thông tin file PDF.", ex);
            }
        }

        public bool IsValidFileSize(long fileSize, int maxSizeInMb = 10)
        {
            var maxSizeInBytes = maxSizeInMb * 1024 * 1024;
            return fileSize > 0 && fileSize <= maxSizeInBytes;
        }

        public bool IsValidPdfFile(string fileName)
        {
            if (string.IsNullOrWhiteSpace(fileName))
            {
                return false;
            }

            var extension = Path.GetExtension(fileName);
            return extension.Equals(".pdf", StringComparison.OrdinalIgnoreCase);
        }
    }
}
