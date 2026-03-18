namespace CapstoneProject.Server.Models.Chat
{
    /// <summary>
    /// Chunk data gửi về client trong quá trình streaming
    /// </summary>
    public class StreamChunk
    {
        public string Type { get; set; } = "content"; // "start", "content", "sources", "metrics", "done", "error"
        public string? Content { get; set; }
        public string? SessionId { get; set; }
        public List<RAGSource>? Sources { get; set; }
        public StreamMetrics? Metrics { get; set; }
        public string? Error { get; set; }
    }

    /// <summary>
    /// Metrics để đánh giá performance
    /// </summary>
    public class StreamMetrics
    {
        public long TimeToFirstToken { get; set; } // ms
        public long TotalTime { get; set; } // ms
        public int TotalTokens { get; set; }
        public double TokensPerSecond { get; set; }
        public int SourceCount { get; set; }
    }

    /// <summary>
    /// Context cho streaming request
    /// </summary>
    public class StreamingContext
    {
        public string SessionId { get; set; } = string.Empty;
        public string UserId { get; set; } = string.Empty;
        public string UserMessage { get; set; } = string.Empty;
        public string RagContext { get; set; } = string.Empty;
        public string ConversationHistory { get; set; } = string.Empty;
        public List<RAGSource> Sources { get; set; } = new();
    }
}
