namespace CapstoneProject.Server.Models.Pdf
{
    public class PdfExtractionResult
    {
        public string FileName { get; set; }
        public PdfInfo PdfInfo { get; set; }
        public string ExtractedText { get; set; }
        public int TextLength { get; set; }
        public string? TextPreview { get; set; }
    }
}
