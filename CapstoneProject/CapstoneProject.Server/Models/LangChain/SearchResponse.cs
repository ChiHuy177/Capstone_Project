

namespace CapstoneProject.Server.Models.LangChain
{
    public class SearchResponse
    {
        public List<SearchResult> Results { get; set; } = new();
    }

    public class SearchResult
    {
        public string Content { get; set; } = string.Empty;

        public SearchMetadata Metadata { get; set; } = new();

        public double Score { get; set; }
    }

    public class SearchMetadata
    {
        public string DocumentId { get; set; } = string.Empty;

        public int ChunkIndex { get; set; }

        public int Page { get; set; }

        public string SourceFile { get; set; } = string.Empty;

        public string Source { get; set; } = string.Empty;

        public int TotalPages { get; set; }

        public string UploadedAt { get; set; } = string.Empty;

        public int? AcademicYear { get; set; }

        public bool? IsActive { get; set; }

        public double? RelevanceScore { get; set; }

        public string? Category { get; set; }

        public string? Type { get; set; }
    }

    // Advanced Search Response
    public class AdvancedSearchResponse
    {
        public List<SearchResult> Results { get; set; } = new();
        public QueryInfo? QueryInfo { get; set; }
    }

    public class QueryInfo
    {
        public string Original { get; set; } = string.Empty;
        public string Normalized { get; set; } = string.Empty;
        public List<string> Intents { get; set; } = new();
        public List<string> Keywords { get; set; } = new();
        public List<string> ExpandedQueries { get; set; } = new();
    }

    // Chat Context Response
    public class ChatContextResponse
    {
        public string Context { get; set; } = string.Empty;
        public List<ContextSource> Sources { get; set; } = new();
        public QueryInfo? QueryInfo { get; set; }
    }

    public class ContextSource
    {
        public string File { get; set; } = string.Empty;
        public int Page { get; set; }
        public double Score { get; set; }
    }
}
