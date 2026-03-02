namespace CapstoneProject.Server.Models.Chat
{
    public class SendMessageResponse
    {
        public string Message { get; set; } = string.Empty;

        public string SessionId { get; set; } = string.Empty;

        public List<RAGSource> Sources { get; set; } = new();

        public DateTime Timestamp { get; set; } = DateTime.UtcNow;

        public bool Success { get; set; } = true;

        public string? Error { get; set; }
    }

    public class RAGSource
    {
        public string Content { get; set; } = string.Empty;

        public string SourceFile { get; set; } = string.Empty;

        public int Page { get; set; }

        public double Score { get; set; }
    }
}
