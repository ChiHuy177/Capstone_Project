using CapstoneProject.Server.Data;
using CapstoneProject.Server.Models;
using CapstoneProject.Server.Models.Chat;
using CapstoneProject.Server.Models.LangChain;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using System.Text;
using CapstoneProject.Server.Repository.interfaces;
using CapstoneProject.Server.Services.interfaces;

namespace CapstoneProject.Server.Services
{
    public class ChatService : IChatService
    {
        private readonly ApplicationDbContext _context;

        private readonly IChatRepository _chatRepository;

        private readonly IKnowledgeService _knowledgeService;

        private readonly IConfiguration _configuration;

        private readonly IGenericRepository<ChatMessage> _genericRepository;

        private readonly ILangChainService _langChainService;

        private readonly ILogger<ChatService> _logger;

        public ChatService(
            ApplicationDbContext context,
            IChatRepository chatRepository,
            IKnowledgeService knowledgeService,
            IConfiguration configuration,
            IGenericRepository<ChatMessage> genericRepository,
            ILangChainService langChainService,
            ILogger<ChatService> logger)
        {
            _context = context;
            _chatRepository = chatRepository;
            _knowledgeService = knowledgeService;
            _configuration = configuration;
            _genericRepository = genericRepository;
            _langChainService = langChainService;
            _logger = logger;
        }

        public async Task<ChatMessage> SaveMessageAsync(ChatMessage message)
        {
            await _chatRepository.AddAsync(message);
            return message;
        }

        public async Task<string> GetGeminiReponseAsync(string userMessage, string model, string url, string apiKey)
        {
            var swAll = System.Diagnostics.Stopwatch.StartNew();

            using var client = new HttpClient();
            client.DefaultRequestHeaders.Add("x-goog-api-key", apiKey);

            var requestBody = new
            {
                contents = new[] {
                        new {
                            parts = new [] {
                                new { text = userMessage}
                            }
                        }
                    },
            };

            var jsonContent = new StringContent(
                System.Text.Json.JsonSerializer.Serialize(requestBody),
                Encoding.UTF8,
                "application/json"
            );

            var sentAt = DateTime.UtcNow;
            var sw = System.Diagnostics.Stopwatch.StartNew();

            var response = await client.PostAsync($"{url}?key={apiKey}", jsonContent);
            var respText = await response.Content.ReadAsStringAsync();

            sw.Stop();
            var receivedAt = DateTime.UtcNow;
            var duration = sw.ElapsedMilliseconds;

            Console.WriteLine($"Sent: {sentAt}, Received: {receivedAt}, Duration: {duration}ms");

            try
            {
                using var doc = JsonDocument.Parse(respText);
                var text = doc.RootElement
                    .GetProperty("candidates")[0]
                    .GetProperty("content")
                    .GetProperty("parts")[0]
                    .GetProperty("text")
                    .GetString();

                return text ?? "Không có phản hồi từ Gemini";
            }
            catch
            {
                return $"Không parse được phản hồi:\n{respText}";
            }
            finally
            {
                swAll.Stop();
                Console.WriteLine($"Time of All SYTEM: {swAll.ElapsedMilliseconds}");
            }

        }


        public async Task<List<ChatMessage>> GetChatHistoryAsync(string userId, int limit = 50)
        {
            return await _chatRepository.GetChatHistory(userId, limit);
        }

        public async Task<List<ChatMessage>> GetChatHistoryBySessionAsync(string sessionId, int limit = 50)
        {
            return await _chatRepository.GetChatHistoryBySessionAsync(sessionId, limit);
        }

        public async Task<List<ChatMessage>> GetAllMessagesAsync(int limit = 100)
        {
            return await _chatRepository.GetAll(limit);
        }

        public async Task<List<string>> GetUserSessionsAsync(string userId)
        {
            return await _chatRepository.GetUserSession(userId);
        }

        //public Task<List<long>> GetNumberOfMessagesAsync()
        //{
        //    throw new NotImplementedException();
        //}

        public async Task<object> GetNumberOfMessagesAsync()
        {
            var allMessage = await _genericRepository.CountAsync(x => true);
            var userMessage = await _genericRepository.CountAsync(x => x.IsUserMessage);
            var botMessage = await _genericRepository.CountAsync(x => !x.IsUserMessage);
            var numberOfUsers = await _context.ChatMessages.Select(x => x.SessionId).Distinct().CountAsync();
            var result = new
            {
                allMessage,
                userMessage,
                botMessage,
                numberOfUsers
            };
            return result;

        }

        public async Task<string> GetAIResponseAsync(string userMessage, string apiKey, string model)
        {
            var swAll = System.Diagnostics.Stopwatch.StartNew();

            var knowledge = _knowledgeService.GetKnowledge();

            var url = "https://openrouter.ai/api/v1/chat/completions";

            using var client = new HttpClient();

            // Headers
            client.DefaultRequestHeaders.Authorization =
                new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", apiKey);

            string prompt = $@"# VAI TRÒ
            Bạn là một chuyên viên tư vấn tuyển sinh thân thiện và chuyên nghiệp của trường Đại học Quốc tế Miền Đông (EIU) tại Việt Nam.

            # NHIỆM VỤ
            Mục tiêu của bạn là cung cấp thông tin chính xác và hữu ích cho các thí sinh và phụ huynh dựa trên nguồn tài liệu sẽ được cung cấp ở cuối prompt này.

            # QUY TẮC BẮT BUỘC
            1.  **Nguồn kiến thức DUY NHẤT:** Bạn CHỈ ĐƯỢC PHÉP sử dụng nội dung trong khối ""KNOWLEDGE"" (ở cuối) để xây dựng câu trả lời.
            2.  **CẤM TUYỆT ĐỐI:** Nghiêm cấm suy diễn, thêm thông tin, hoặc sử dụng bất kỳ kiến thức nào bên ngoài khối ""KNOWLEDGE"".
            3.  **QUY TẮC DỰ PHÒNG (Fallback):** Nếu câu hỏi không thể được trả lời bằng ""KNOWLEDGE"", bạn BẮT BUỘC phải trả lời chính xác như sau (không thêm/bớt từ nào):
                ""Tôi chưa được cập nhật thông tin này, hãy liên hệ với email của EIU để tìm hiểu thêm bạn nhé!""
            4.  **PHONG CÁCH:** Giữ giọng điệu thân thiện, chuyên nghiệp. Trả lời ngắn gọn, súc tích, tập trung vào câu hỏi của người dùng.

            # KNOWLEDGE
            Dưới đây là toàn bộ thông tin bạn được phép sử dụng:
            {knowledge}";


            var requestBody = new
            {
                model = model,
                messages = new object[]
                {
                    new { role = "system", content = prompt },
                    new { role = "user",   content = userMessage }
                },
                max_tokens = 1024,
                stream = false
            };

            var jsonContent = new StringContent(
                System.Text.Json.JsonSerializer.Serialize(requestBody),
                Encoding.UTF8,
                "application/json"
            );

            var sentAt = DateTime.UtcNow;
            var sw = System.Diagnostics.Stopwatch.StartNew();


            using var response = await client.PostAsync(url, jsonContent);
            var respText = await response.Content.ReadAsStringAsync();

            sw.Stop();
            var receivedAt = DateTime.UtcNow;
            Console.WriteLine($"[DeepSeek] Sent: {sentAt:o}, Received: {receivedAt:o}, Duration: {sw.ElapsedMilliseconds}ms, Status: {(int)response.StatusCode}");

            try
            {
                using var doc = JsonDocument.Parse(respText);
                var root = doc.RootElement;

                if (!response.IsSuccessStatusCode)
                {
                    if (root.TryGetProperty("error", out var err))
                    {
                        var msg = err.TryGetProperty("message", out var m) ? m.GetString() : err.ToString();
                        return $"Lỗi API: {msg}";
                    }
                    return $"HTTP {(int)response.StatusCode}: {respText}";
                }

                var content = root
                    .GetProperty("choices")[0]
                    .GetProperty("message")
                    .GetProperty("content")
                    .GetString();

                return string.IsNullOrWhiteSpace(content) ? "Không có phản hồi từ DeepSeek" : content;
            }
            catch (Exception)
            {
                return $"Không parse được phản hồi:\n{respText}";
            }
            finally
            {
                swAll.Stop();
                Console.WriteLine($"[DeepSeek] Time of All SYSTEM: {swAll.ElapsedMilliseconds}ms");
            }
        }

        public async Task<SendMessageResponse> SendMessageWithRAGAsync(SendMessageRequest request)
        {
            var sw = System.Diagnostics.Stopwatch.StartNew();
            var response = new SendMessageResponse
            {
                SessionId = request.SessionId ?? Guid.NewGuid().ToString(),
                Timestamp = DateTime.UtcNow
            };

            try
            {
                // 1. Lưu tin nhắn của user
                var userMessage = new ChatMessage
                {
                    UserId = request.UserId ?? "anonymous",
                    Message = request.Message,
                    IsUserMessage = true,
                    Timestamp = DateTime.UtcNow,
                    SessionId = response.SessionId
                };
                await SaveMessageAsync(userMessage);

                // 2. Lấy RAG context từ LangChain service
                var ragContext = await GetRAGContextAsync(request.Message, request.Year);

                // 3. Tạo response từ AI với RAG context
                var aiResponse = await GetAIResponseWithRAGAsync(request.Message, ragContext.Context, response.SessionId);

                // 4. Lưu tin nhắn của bot
                var botMessage = new ChatMessage
                {
                    UserId = request.UserId ?? "anonymous",
                    Message = aiResponse,
                    IsUserMessage = false,
                    Timestamp = DateTime.UtcNow,
                    SessionId = response.SessionId
                };
                await SaveMessageAsync(botMessage);

                response.Message = aiResponse;
                response.Sources = ragContext.Sources;
                response.Success = true;

                sw.Stop();
                _logger.LogInformation(
                    "[RAG Chat] SessionId: {SessionId}, Duration: {Duration}ms, Sources: {SourceCount}",
                    response.SessionId,
                    sw.ElapsedMilliseconds,
                    response.Sources.Count);

                return response;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in SendMessageWithRAGAsync");
                response.Success = false;
                response.Error = "Đã xảy ra lỗi khi xử lý tin nhắn. Vui lòng thử lại.";
                response.Message = "Tôi chưa được cập nhật thông tin này, hãy liên hệ với email của EIU để tìm hiểu thêm bạn nhé!";
                return response;
            }
        }

        private async Task<(string Context, List<RAGSource> Sources)> GetRAGContextAsync(string userMessage, int? year)
        {
            var sources = new List<RAGSource>();
            var contextBuilder = new StringBuilder();

            try
            {
                // Check health của LangChain service
                var isHealthy = await _langChainService.HealthCheckAsync();
                if (!isHealthy)
                {
                    _logger.LogWarning("LangChain service is not available, falling back to static knowledge");
                    return (_knowledgeService.GetKnowledge(), sources);
                }

                // Search documents
                var searchRequest = new SearchRequest
                {
                    Query = userMessage,
                    TopK = 5,
                    Year = year
                };

                var searchResponse = await _langChainService.SearchDocumentsAsync(searchRequest);

                if (searchResponse.Results == null || searchResponse.Results.Count == 0)
                {
                    _logger.LogInformation("No RAG results found, falling back to static knowledge");
                    return (_knowledgeService.GetKnowledge(), sources);
                }

                // Format context từ search results
                foreach (var result in searchResponse.Results)
                {
                    contextBuilder.AppendLine($"[Nguồn: {result.Metadata.SourceFile}, Trang {result.Metadata.Page}]");
                    contextBuilder.AppendLine(result.Content);
                    contextBuilder.AppendLine("---");

                    sources.Add(new RAGSource
                    {
                        Content = result.Content.Length > 200
                            ? result.Content.Substring(0, 200) + "..."
                            : result.Content,
                        SourceFile = result.Metadata.SourceFile,
                        Page = result.Metadata.Page,
                        Score = result.Score
                    });
                }

                _logger.LogInformation("RAG context built with {Count} sources", sources.Count);
                return (contextBuilder.ToString(), sources);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting RAG context, falling back to static knowledge");
                return (_knowledgeService.GetKnowledge(), sources);
            }
        }

        private async Task<string> GetAIResponseWithRAGAsync(string userMessage, string ragContext, string sessionId)
        {
            // Fetch conversation history (last 5 messages)
            var conversationHistory = await GetConversationHistoryAsync(sessionId, 5);
            var url = "https://openrouter.ai/api/v1/chat/completions";
            var apiKey = _configuration["OpenRouter:ApiKey"];
            var model = _configuration["OpenRouter:Model"] ?? "deepseek/deepseek-chat";

            if (string.IsNullOrEmpty(apiKey))
            {
                _logger.LogWarning("OpenRouter API key not configured");
                return "Hệ thống đang bảo trì, vui lòng thử lại sau.";
            }

            using var client = new HttpClient();
            client.DefaultRequestHeaders.Authorization =
                new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", apiKey);

            string prompt = $@"# VAI TRÒ
Bạn là một chuyên viên tư vấn tuyển sinh thân thiện và chuyên nghiệp của trường Đại học Quốc tế Miền Đông (EIU) tại Việt Nam.

# NHIỆM VỤ
Mục tiêu của bạn là cung cấp thông tin chính xác và hữu ích cho các thí sinh và phụ huynh dựa trên nguồn tài liệu được cung cấp.

# QUY TẮC BẮT BUỘC
1. **Nguồn kiến thức DUY NHẤT:** Bạn CHỈ ĐƯỢC PHÉP sử dụng nội dung trong khối ""KNOWLEDGE"" để xây dựng câu trả lời.
2. **CẤM TUYỆT ĐỐI:** Nghiêm cấm suy diễn, thêm thông tin, hoặc sử dụng bất kỳ kiến thức nào bên ngoài khối ""KNOWLEDGE"".
3. **QUY TẮC DỰ PHÒNG:** Nếu câu hỏi không thể được trả lời bằng ""KNOWLEDGE"", bạn BẮT BUỘC phải trả lời:
   ""Tôi chưa được cập nhật thông tin này, hãy liên hệ với email của EIU để tìm hiểu thêm bạn nhé!""
4. **PHONG CÁCH:** Giữ giọng điệu thân thiện, chuyên nghiệp. Trả lời ngắn gọn, súc tích.
5. **TRÍCH DẪN:** Khi trả lời, hãy đề cập nguồn tài liệu nếu có thể (ví dụ: ""Theo tài liệu trang X..."").
6. **NGỮ CẢNH HỘI THOẠI:** Sử dụng lịch sử hội thoại để hiểu ngữ cảnh và trả lời các câu hỏi tiếp nối.

# LỊCH SỬ HỘI THOẠI
{conversationHistory}

# KNOWLEDGE
{ragContext}";

            var requestBody = new
            {
                model = model,
                messages = new object[]
                {
                    new { role = "system", content = prompt },
                    new { role = "user", content = userMessage }
                },
                max_tokens = 1024,
                stream = false
            };

            var jsonContent = new StringContent(
                JsonSerializer.Serialize(requestBody),
                Encoding.UTF8,
                "application/json"
            );

            var sw = System.Diagnostics.Stopwatch.StartNew();
            using var response = await client.PostAsync(url, jsonContent);
            var respText = await response.Content.ReadAsStringAsync();
            sw.Stop();

            _logger.LogInformation("[AI Response] Duration: {Duration}ms, Status: {Status}",
                sw.ElapsedMilliseconds, (int)response.StatusCode);

            try
            {
                using var doc = JsonDocument.Parse(respText);
                var root = doc.RootElement;

                if (!response.IsSuccessStatusCode)
                {
                    if (root.TryGetProperty("error", out var err))
                    {
                        var msg = err.TryGetProperty("message", out var m) ? m.GetString() : err.ToString();
                        _logger.LogError("AI API Error: {Error}", msg);
                    }
                    return "Tôi chưa được cập nhật thông tin này, hãy liên hệ với email của EIU để tìm hiểu thêm bạn nhé!";
                }

                var content = root
                    .GetProperty("choices")[0]
                    .GetProperty("message")
                    .GetProperty("content")
                    .GetString();

                return string.IsNullOrWhiteSpace(content)
                    ? "Tôi chưa được cập nhật thông tin này, hãy liên hệ với email của EIU để tìm hiểu thêm bạn nhé!"
                    : content;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error parsing AI response: {Response}", respText);
                return "Tôi chưa được cập nhật thông tin này, hãy liên hệ với email của EIU để tìm hiểu thêm bạn nhé!";
            }
        }

        private async Task<string> GetConversationHistoryAsync(string sessionId, int messageCount)
        {
            try
            {
                var messages = await _chatRepository.GetChatHistoryBySessionAsync(sessionId, messageCount * 2);

                if (messages == null || messages.Count == 0)
                {
                    return "(Không có lịch sử hội thoại trước đó)";
                }

                var historyBuilder = new StringBuilder();
                foreach (var msg in messages.OrderBy(m => m.Timestamp))
                {
                    var role = msg.IsUserMessage ? "User" : "Assistant";
                    historyBuilder.AppendLine($"{role}: {msg.Message}");
                }

                return historyBuilder.ToString();
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to fetch conversation history for session {SessionId}", sessionId);
                return "(Không có lịch sử hội thoại trước đó)";
            }
        }

        #region Streaming Implementation

        public async IAsyncEnumerable<StreamChunk> StreamMessageWithRAGAsync(
            SendMessageRequest request,
            [System.Runtime.CompilerServices.EnumeratorCancellation] CancellationToken cancellationToken = default)
        {
            var overallStopwatch = System.Diagnostics.Stopwatch.StartNew();
            var sessionId = request.SessionId ?? Guid.NewGuid().ToString();
            var fullResponse = new StringBuilder();
            var tokenCount = 0;
            long? timeToFirstToken = null;

            // 1. Send start event
            yield return new StreamChunk
            {
                Type = "start",
                SessionId = sessionId
            };

            // 2. Save user message
            var userMessage = new ChatMessage
            {
                UserId = request.UserId ?? "anonymous",
                Message = request.Message,
                IsUserMessage = true,
                Timestamp = DateTime.UtcNow,
                SessionId = sessionId
            };
            await SaveMessageAsync(userMessage);

            // 3. Get RAG context
            var ragContext = await GetRAGContextAsync(request.Message, request.Year);

            // 4. Send sources immediately
            if (ragContext.Sources.Count > 0)
            {
                yield return new StreamChunk
                {
                    Type = "sources",
                    Sources = ragContext.Sources
                };
            }

            // 5. Stream AI response
            var streamingContext = new StreamingContext
            {
                SessionId = sessionId,
                UserId = request.UserId ?? "anonymous",
                UserMessage = request.Message,
                RagContext = ragContext.Context,
                ConversationHistory = await GetConversationHistoryAsync(sessionId, 5),
                Sources = ragContext.Sources
            };

            await foreach (var chunk in StreamAIResponseAsync(streamingContext, cancellationToken))
            {
                if (cancellationToken.IsCancellationRequested)
                    yield break;

                // Track TTFT
                if (timeToFirstToken == null && !string.IsNullOrEmpty(chunk.Content))
                {
                    timeToFirstToken = overallStopwatch.ElapsedMilliseconds;
                }

                if (!string.IsNullOrEmpty(chunk.Content))
                {
                    fullResponse.Append(chunk.Content);
                    tokenCount++;
                }

                yield return chunk;
            }

            // 6. Save bot message
            var botMessage = new ChatMessage
            {
                UserId = request.UserId ?? "anonymous",
                Message = fullResponse.ToString(),
                IsUserMessage = false,
                Timestamp = DateTime.UtcNow,
                SessionId = sessionId
            };
            await SaveMessageAsync(botMessage);

            overallStopwatch.Stop();

            // 7. Send metrics
            var totalTime = overallStopwatch.ElapsedMilliseconds;
            yield return new StreamChunk
            {
                Type = "metrics",
                Metrics = new StreamMetrics
                {
                    TimeToFirstToken = timeToFirstToken ?? 0,
                    TotalTime = totalTime,
                    TotalTokens = tokenCount,
                    TokensPerSecond = totalTime > 0 ? Math.Round(tokenCount / (totalTime / 1000.0), 2) : 0,
                    SourceCount = ragContext.Sources.Count
                }
            };

            // 8. Send done event
            yield return new StreamChunk
            {
                Type = "done",
                SessionId = sessionId
            };

            _logger.LogInformation(
                "[Streaming] Session: {SessionId}, TTFT: {TTFT}ms, Total: {Total}ms, Tokens: {Tokens}",
                sessionId, timeToFirstToken, totalTime, tokenCount);
        }

        private async IAsyncEnumerable<StreamChunk> StreamAIResponseAsync(
            StreamingContext context,
            [System.Runtime.CompilerServices.EnumeratorCancellation] CancellationToken cancellationToken = default)
        {
            var url = "https://openrouter.ai/api/v1/chat/completions";
            var apiKey = _configuration["OpenRouter:ApiKey"];
            var model = _configuration["OpenRouter:Model"] ?? "deepseek/deepseek-chat";

            if (string.IsNullOrEmpty(apiKey))
            {
                yield return new StreamChunk
                {
                    Type = "error",
                    Error = "API key not configured"
                };
                yield break;
            }

            string prompt = $@"# VAI TRÒ
Bạn là một chuyên viên tư vấn tuyển sinh thân thiện và chuyên nghiệp của trường Đại học Quốc tế Miền Đông (EIU) tại Việt Nam.

# NHIỆM VỤ
Mục tiêu của bạn là cung cấp thông tin chính xác và hữu ích cho các thí sinh và phụ huynh dựa trên nguồn tài liệu được cung cấp.

# QUY TẮC BẮT BUỘC
1. **Nguồn kiến thức DUY NHẤT:** Bạn CHỈ ĐƯỢC PHÉP sử dụng nội dung trong khối ""KNOWLEDGE"" để xây dựng câu trả lời.
2. **CẤM TUYỆT ĐỐI:** Nghiêm cấm suy diễn, thêm thông tin, hoặc sử dụng bất kỳ kiến thức nào bên ngoài khối ""KNOWLEDGE"".
3. **QUY TẮC DỰ PHÒNG:** Nếu câu hỏi không thể được trả lời bằng ""KNOWLEDGE"", bạn BẮT BUỘC phải trả lời:
   ""Tôi chưa được cập nhật thông tin này, hãy liên hệ với email của EIU để tìm hiểu thêm bạn nhé!""
4. **PHONG CÁCH:** Giữ giọng điệu thân thiện, chuyên nghiệp. Trả lời ngắn gọn, súc tích.
5. **TRÍCH DẪN:** Khi trả lời, hãy đề cập nguồn tài liệu nếu có thể (ví dụ: ""Theo tài liệu trang X..."").
6. **NGỮ CẢNH HỘI THOẠI:** Sử dụng lịch sử hội thoại để hiểu ngữ cảnh và trả lời các câu hỏi tiếp nối.

# LỊCH SỬ HỘI THOẠI
{context.ConversationHistory}

# KNOWLEDGE
{context.RagContext}";

            var requestBody = new
            {
                model = model,
                messages = new object[]
                {
                    new { role = "system", content = prompt },
                    new { role = "user", content = context.UserMessage }
                },
                max_tokens = 1024,
                stream = true // Enable streaming
            };

            using var client = new HttpClient();
            client.DefaultRequestHeaders.Authorization =
                new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", apiKey);
            client.Timeout = TimeSpan.FromMinutes(2);

            var jsonContent = new StringContent(
                JsonSerializer.Serialize(requestBody),
                Encoding.UTF8,
                "application/json"
            );

            HttpResponseMessage? response = null;
            try
            {
                response = await client.PostAsync(url, jsonContent, cancellationToken);

                if (!response.IsSuccessStatusCode)
                {
                    var errorText = await response.Content.ReadAsStringAsync(cancellationToken);
                    _logger.LogError("Streaming API error: {Error}", errorText);
                    yield return new StreamChunk
                    {
                        Type = "content",
                        Content = "Tôi chưa được cập nhật thông tin này, hãy liên hệ với email của EIU để tìm hiểu thêm bạn nhé!"
                    };
                    yield break;
                }

                using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
                using var reader = new StreamReader(stream);

                while (!reader.EndOfStream && !cancellationToken.IsCancellationRequested)
                {
                    var line = await reader.ReadLineAsync(cancellationToken);

                    if (string.IsNullOrWhiteSpace(line))
                        continue;

                    if (!line.StartsWith("data: "))
                        continue;

                    var data = line.Substring(6);

                    if (data == "[DONE]")
                        break;

                    var chunk = ParseStreamChunk(data);
                    if (!string.IsNullOrEmpty(chunk))
                    {
                        yield return new StreamChunk
                        {
                            Type = "content",
                            Content = chunk
                        };
                    }
                }
            }
            finally
            {
                response?.Dispose();
            }
        }

        private string? ParseStreamChunk(string json)
        {
            try
            {
                using var doc = JsonDocument.Parse(json);
                var root = doc.RootElement;

                if (root.TryGetProperty("choices", out var choices) && choices.GetArrayLength() > 0)
                {
                    var choice = choices[0];
                    if (choice.TryGetProperty("delta", out var delta) &&
                        delta.TryGetProperty("content", out var content))
                    {
                        return content.GetString();
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning("Failed to parse stream chunk: {Error}", ex.Message);
            }
            return null;
        }

        #endregion
    }
}