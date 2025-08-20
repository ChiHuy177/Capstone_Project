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

        public ChatService(ApplicationDbContext context, IChatRepository chatRepository, IKnowledgeService knowledgeService, IConfiguration configuration)
        {
            _context = context;
            _chatRepository = chatRepository;
            _knowledgeService = knowledgeService;
            _configuration = configuration;
        }

        public async Task<ChatMessage> SaveMessageAsync(ChatMessage message)
        {
            _context.ChatMessages.Add(message);
            await _context.SaveChangesAsync();
            return message;
        }
   

        //public async Task<string> GetChatGptResponseAsync(string userMessage)
        //{
        //    using var client = new HttpClient();

        //    var requestBody = new
        //    {
        //        contents = new[]
        //        {
        //        new
        //        {
        //            parts = new[]
        //            {
        //                new { text = userMessage }
        //            }
        //        }
        //    }
        //    };

        //    var jsonContent = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");

        //    var response = await client.PostAsync(Endpoint, jsonContent);

        //    if (response.IsSuccessStatusCode)
        //    {
        //        var json = await response.Content.ReadAsStringAsync();
        //        using var doc = JsonDocument.Parse(json);

        //        // Trích xuất phần phản hồi
        //        var content = doc.RootElement
        //            .GetProperty("candidates")[0]
        //            .GetProperty("content")
        //            .GetProperty("parts")[0]
        //            .GetProperty("text")
        //            .GetString();

        //        return content ?? "Không có phản hồi từ Gemini";
        //    }
        //    else
        //    {
        //        var error = await response.Content.ReadAsStringAsync();
        //        return $"Lỗi gọi Gemini API: {response.StatusCode}\n{error}";
        //    }
        //}
        public async Task<string> GetChatGptResponseAsync(string userMessage)
        {
            var Model = _configuration["GrogApiModel"];
            var Url = _configuration["GrogApiUrl"];


            var apiKey = _configuration["GrogApiKey"];
            if (string.IsNullOrWhiteSpace(apiKey))
                return "Thiếu GROQ_API_KEY. Vui lòng đặt biến môi trường GROQ_API_KEY.";

            using var client = new HttpClient();
            client.DefaultRequestHeaders.Add("Authorization", $"Bearer {apiKey}");


            // Đọc knowledge.txt 
            string knowledge = _knowledgeService.GetKnowledge();


            var contentForUser = string.IsNullOrWhiteSpace(knowledge)
                ? userMessage
                : $"CONTEXT:\n{knowledge}\n\nCÂU HỎI:\n{userMessage}";

            var requestBody = new
            {
                model = Model,
                messages = new object[]
                {
                    new { role = "system", content = "Chỉ dùng thông tin trong CONTEXT khi trả lời, không được đề cập về việc đọc file Context ở câu trả lời. Nếu thiếu dữ liệu thì có thể search từ trường Đại học quốc tế miền đông." },
                    new { role = "user", content = contentForUser }
                },
                temperature = 0.2,
                stream = false
            };

            var jsonContent = new StringContent(
                System.Text.Json.JsonSerializer.Serialize(requestBody),
                Encoding.UTF8,
                "application/json"
            );

            var response = await client.PostAsync(Url, jsonContent);
            var respText = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
                return $"Groq API error: {(int)response.StatusCode} {response.StatusCode}\n{respText}";

            try
            {
                using var doc = JsonDocument.Parse(respText);
                var content = doc.RootElement
                    .GetProperty("choices")[0]
                    .GetProperty("message")
                    .GetProperty("content")
                    .GetString();

                return content ?? "Không có phản hồi từ Groq";
            }
            catch
            {
                return $"Không parse được phản hồi:\n{respText}";
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

        public Task<List<long>> GetNumberOfMessagesAsync()
        {
            throw new NotImplementedException();
        }

        //public async Task<List<long>> GetNumberOfMessagesAsync()
        //{
        //    return await _chatRepository
        //}
    }
}