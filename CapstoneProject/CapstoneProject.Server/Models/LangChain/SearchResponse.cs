

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
    }
}
