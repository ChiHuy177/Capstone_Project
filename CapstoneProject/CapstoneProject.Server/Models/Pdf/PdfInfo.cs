namespace CapstoneProject.Server.Models.Pdf
{
    public class PdfInfo
    {
        public int NumberOfPages { get; set; }
        public string? Title { get; set; }
        public string? Author { get; set; }
        public string? CreationDate { get; set; }
        public long FileSize { get; set; }
    }
}
