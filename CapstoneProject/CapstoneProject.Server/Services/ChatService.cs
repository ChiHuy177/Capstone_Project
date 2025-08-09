using CapstoneProject.Server.Data;
using CapstoneProject.Server.Models;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using System.Text;

namespace CapstoneProject.Server.Services
{
    public class ChatService : IChatService
    {
        private readonly ApplicationDbContext _context;

        public ChatService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<ChatMessage> SaveMessageAsync(ChatMessage message)
        {
            _context.ChatMessages.Add(message);
            await _context.SaveChangesAsync();
            return message;
        }
        private const string ApiKey = "AIzaSyATpv1VA5t3jl1L8qV5FN2JC-KpIYzrVT8"; // Thay bằng API key của bạn
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
            return await _context.ChatMessages
                .Where(m => m.UserId == userId)
                .OrderByDescending(m => m.Timestamp)
                .Take(limit)
                .ToListAsync();
        }

        public async Task<List<ChatMessage>> GetChatHistoryBySessionAsync(string sessionId, int limit = 50)
        {
            return await _context.ChatMessages
                .Where(m => m.SessionId == sessionId)
                .OrderBy(m => m.Timestamp)
                .Take(limit)
                .ToListAsync();
        }

        public async Task<List<ChatMessage>> GetAllMessagesAsync(int limit = 100)
        {
            return await _context.ChatMessages
                .OrderByDescending(m => m.Timestamp)
                .Take(limit)
                .ToListAsync();
        }

        public async Task<List<string>> GetUserSessionsAsync(string userId)
        {
            return await _context.ChatMessages
                .Where(m => m.UserId == userId && m.SessionId != null)
                .Select(m => m.SessionId!)
                .Distinct()
                .ToListAsync();
        }
    }
}