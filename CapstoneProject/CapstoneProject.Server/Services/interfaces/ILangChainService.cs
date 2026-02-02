using CapstoneProject.Server.Models.LangChain;

namespace CapstoneProject.Server.Services.interfaces
{
    public interface ILangChainService
    {
        Task<ProcessPdfResponse> ProcessPdfAsync(IFormFile file, int year = 2026, string uploadedBy = "admin");
        Task<SearchResponse> SearchDocumentsAsync(SearchRequest request);
        Task<bool> HealthCheckAsync();
    }
}
