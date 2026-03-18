using CapstoneProject.Server.Models.Pdf;

namespace CapstoneProject.Server.Services.interfaces
{
    public interface IPdfReaderService
    {
        Task<string> ExtractTextFromPdfAsync(Stream pdfStream);
        Task<PdfInfo> GetPdfInfoAsync(Stream pdfStream);
        bool IsValidPdfFile(string fileName);
        bool IsValidFileSize(long fileSize, int maxSizeInMb = 10);
    }
}
