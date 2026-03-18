namespace CapstoneProject.Server.Models.LangChain
{
    public class ProcessPdfResponse
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public string DocumentId { get; set; } = string.Empty;
        public int NumChunks { get; set; }
    }
}
