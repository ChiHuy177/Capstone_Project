using CapstoneProject.Server.Data;
using CapstoneProject.Server.Models;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using System.Text;
using CapstoneProject.Server.Repository.interfaces;

namespace CapstoneProject.Server.Services
{
    public class ChatService : IChatService
    {
        private readonly ApplicationDbContext _context;

        private readonly IChatRepository _chatRepository;

        public ChatService(ApplicationDbContext context,IChatRepository chatRepository)
        {
            _context = context;
            _chatRepository = chatRepository;
        }

        public async Task<ChatMessage> SaveMessageAsync(ChatMessage message)
        {
            _context.ChatMessages.Add(message);
            await _context.SaveChangesAsync();
            return message;
        }
        private const string ApiKey = "AIzaSyATpv1VA5t3jl1L8qV5FN2JC-KpIYzrVT8";
        private const string Endpoint = $"https://generativelanguage.googleapis.com/v1/models/gemini-2.5-pro:generateContent?key={ApiKey}";

        public async Task<string> GetChatGptResponseAsync(string userMessage)
        {
            using var client = new HttpClient();

            var requestBody = new
            {
                contents = new[]
                {
                new
                {
                    parts = new[]
                    {
                        new { text = userMessage }
                    }
                }
            }
            };

            var jsonContent = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");

            var response = await client.PostAsync(Endpoint, jsonContent);

            if (response.IsSuccessStatusCode)
            {
                var json = await response.Content.ReadAsStringAsync();
                using var doc = JsonDocument.Parse(json);

                // Trích xuất phần phản hồi
                var content = doc.RootElement
                    .GetProperty("candidates")[0]
                    .GetProperty("content")
                    .GetProperty("parts")[0]
                    .GetProperty("text")
                    .GetString();

                return content ?? "Không có phản hồi từ Gemini";
            }
            else
            {
                var error = await response.Content.ReadAsStringAsync();
                return $"Lỗi gọi Gemini API: {response.StatusCode}\n{error}";
            }
        }

        public async Task<List<ChatMessage>> GetChatHistoryAsync(string userId, int limit = 50)
        {
            return await _chatRepository.GetChatHistory(userId, limit);
        }

        public async Task<List<ChatMessage>> GetChatHistoryBySessionAsync(string sessionId, int limit = 50)
        {
            return await _chatRepository.GetChatHistoryBySessionAsync (sessionId, limit);
        }

        public async Task<List<ChatMessage>> GetAllMessagesAsync(int limit = 100)
        {
            return await _chatRepository.GetAll(limit);
        }

        public async Task<List<string>> GetUserSessionsAsync(string userId)
        {
            return await _chatRepository.GetUserSession(userId);
        }
    }
}