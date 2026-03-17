using CapstoneProject.Server.Models.LangChain;
using CapstoneProject.Server.Services.interfaces;
using System.Net.Http.Headers;
using System.Text.Json;

namespace CapstoneProject.Server.Services.implementations
{
    public class LangChainService : ILangChainService
    {
        private readonly HttpClient _httpClient;
        private readonly ILogger<LangChainService> _logger;
        private readonly string _pythonServiceUrl;

        public LangChainService(
            HttpClient httpClient,
            IConfiguration configuration,
            ILogger<LangChainService> logger)
        {
            _httpClient = httpClient;
            _logger = logger;
            _pythonServiceUrl = configuration["LangChain:ServiceUrl"]
                ?? "http://localhost:8000";

            // Set timeout
            _httpClient.Timeout = TimeSpan.FromMinutes(5);
        }

        public async Task<bool> HealthCheckAsync()
        {
            try
            {
                var response = await _httpClient.GetAsync($"{_pythonServiceUrl}/");
                return response.IsSuccessStatusCode;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Python service health check failed");
                return false;
            }
        }

        public async Task<ProcessPdfResponse> ProcessPdfAsync(IFormFile file, int year = 2026, string uploadedBy = "admin")
        {
            try
            {
                _logger.LogInformation("Processing PDF: {FileName}", file.FileName, year);

                using var content = new MultipartFormDataContent();
                using var fileStream = file.OpenReadStream();
                using var streamContent = new StreamContent(fileStream);

                streamContent.Headers.ContentType = new MediaTypeHeaderValue(file.ContentType);
                content.Add(streamContent, "file", file.FileName);

                var url = $"{_pythonServiceUrl}/api/pdf/process?year={year}";
                var response = await _httpClient.PostAsync(url, content);

                response.EnsureSuccessStatusCode();

                var responseJson = await response.Content.ReadAsStringAsync();
                var result = JsonSerializer.Deserialize<ProcessPdfResponse>(
                    responseJson,
                    new JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true
                    });

                _logger.LogInformation(
                        "PDF processed successfully. DocumentId: {DocumentId}, Chunks: {NumChunks}",
                        result?.DocumentId,
                        result?.NumChunks);

                return result ?? new ProcessPdfResponse
                {
                    Success = false,
                    Message = "Failed to parse response"
                };
            }
            catch (HttpRequestException ex)
            {
                _logger.LogError(ex, "HTTP error calling Python service");
                throw new Exception($"Lỗi kết nối Python service: {ex.Message}", ex);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing PDF: {FileName}", file.FileName);
                throw new Exception($"Lỗi xử lý PDF: {ex.Message}", ex);
            }

        }

        public async Task<SearchResponse> SearchDocumentsAsync(SearchRequest request)
        {
            try
            {
                _logger.LogInformation(
                            "Searching documents with query: {Query}, Year: {Year}",
                            request.Query,
                            request.Year
                        );

                var url = $"{_pythonServiceUrl}/api/pdf/search?query={Uri.EscapeDataString(request.Query)}&top_k={request.TopK}";

                if (request.Year.HasValue)
                {
                    url += $"&year={request.Year.Value}";
                }

                var response = await _httpClient.PostAsync(url, null);
                response.EnsureSuccessStatusCode();

                // Parse response
                var responseJson = await response.Content.ReadAsStringAsync();
                var result = JsonSerializer.Deserialize<SearchResponse>(
                    responseJson,
                    new JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true
                    });

                _logger.LogInformation(
                    "Search completed. Found {Count} results",
                    result?.Results?.Count ?? 0);

                return result ?? new SearchResponse();
            }
            catch (HttpRequestException ex)
            {
                _logger.LogError(ex, "HTTP error calling Python service");
                throw new Exception($"Lỗi kết nối Python service: {ex.Message}", ex);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error searching documents");
                throw new Exception($"Lỗi tìm kiếm: {ex.Message}", ex);
            }
        }

        public async Task<AdvancedSearchResponse> AdvancedSearchAsync(SearchRequest request)
        {
            try
            {
                _logger.LogInformation(
                    "Advanced searching with query: {Query}, Year: {Year}",
                    request.Query,
                    request.Year
                );

                var url = $"{_pythonServiceUrl}/api/pdf/advanced/search?query={Uri.EscapeDataString(request.Query)}&top_k={request.TopK}";

                if (request.Year.HasValue)
                {
                    url += $"&year={request.Year.Value}";
                }

                // Add advanced search options
                url += "&use_rerank=true&use_expansion=true";

                var response = await _httpClient.PostAsync(url, null);
                response.EnsureSuccessStatusCode();

                var responseJson = await response.Content.ReadAsStringAsync();
                var result = JsonSerializer.Deserialize<AdvancedSearchResponse>(
                    responseJson,
                    new JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true
                    });

                _logger.LogInformation(
                    "Advanced search completed. Found {Count} results, Intents: {Intents}",
                    result?.Results?.Count ?? 0,
                    string.Join(", ", result?.QueryInfo?.Intents ?? new List<string>()));

                return result ?? new AdvancedSearchResponse();
            }
            catch (HttpRequestException ex)
            {
                _logger.LogError(ex, "HTTP error in advanced search");
                throw new Exception($"Lỗi kết nối Python service: {ex.Message}", ex);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in advanced search");
                throw new Exception($"Lỗi tìm kiếm nâng cao: {ex.Message}", ex);
            }
        }

        public async Task<ChatContextResponse> GetChatContextAsync(string query, int topK = 5, int? year = null)
        {
            try
            {
                _logger.LogInformation(
                    "Getting chat context for query: {Query}",
                    query
                );

                var url = $"{_pythonServiceUrl}/api/pdf/advanced/context?query={Uri.EscapeDataString(query)}&top_k={topK}&max_tokens=2000";

                if (year.HasValue)
                {
                    url += $"&year={year.Value}";
                }

                var response = await _httpClient.PostAsync(url, null);
                response.EnsureSuccessStatusCode();

                var responseJson = await response.Content.ReadAsStringAsync();
                var result = JsonSerializer.Deserialize<ChatContextResponse>(
                    responseJson,
                    new JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true
                    });

                _logger.LogInformation(
                    "Chat context retrieved. Sources: {Count}, Context length: {Length}",
                    result?.Sources?.Count ?? 0,
                    result?.Context?.Length ?? 0);

                return result ?? new ChatContextResponse();
            }
            catch (HttpRequestException ex)
            {
                _logger.LogError(ex, "HTTP error getting chat context");
                throw new Exception($"Lỗi kết nối Python service: {ex.Message}", ex);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting chat context");
                throw new Exception($"Lỗi lấy context: {ex.Message}", ex);
            }
        }
    }
}
