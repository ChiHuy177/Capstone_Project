using CapstoneProject.Server.Data;
using CapstoneProject.Server.Models;
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

        public ChatService(ApplicationDbContext context, IChatRepository chatRepository, IKnowledgeService knowledgeService,
         IConfiguration configuration, IGenericRepository<ChatMessage> genericRepository)
        {
            _context = context;
            _chatRepository = chatRepository;
            _knowledgeService = knowledgeService;
            _configuration = configuration;
            _genericRepository = genericRepository;
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


            var requestBody = new
            {
                model = model,
                messages = new object[]
                {
                    new { role = "system", content = $"Bạn là 1 người làm công tác tuyển sinh của trường Đại học quốc tế miền đông, Việt Nam, dựa vào content này để trả lời ${knowledge}, nếu không có thông tin thì hãy ghi là Tôi chưa được cập nhật thông tin này, hãy liên hệ với email của EIU để tìm hiểu thêm bạn nhé!, không cần trả lời dài dòng gì" },
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
    }
}