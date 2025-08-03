using CapstoneProject.Server.Data;
using CapstoneProject.Server.Models;
using Microsoft.EntityFrameworkCore;

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

        public async Task<string> GetChatGptResponseAsync(string userMessage)
        {
            // Mock ChatGPT responses - trong thực tế sẽ gọi OpenAI API
            await Task.Delay(1000); // Simulate API call delay
            
            var responses = new Dictionary<string, string>
            {
                { "hello", "Xin chào! Tôi có thể giúp gì cho bạn?" },
                { "help", "Tôi có thể giúp bạn với các vấn đề về công nghệ, lập trình, hoặc bất kỳ câu hỏi nào khác." },
                { "how are you", "Tôi đang hoạt động tốt, cảm ơn bạn đã hỏi! Bạn có cần hỗ trợ gì không?" },
                { "bye", "Tạm biệt! Chúc bạn một ngày tốt lành!" },
                { "thanks", "Không có gì! Tôi rất vui được giúp đỡ bạn." }
            };

            var lowerMessage = userMessage.ToLower();
            
            foreach (var response in responses)
            {
                if (lowerMessage.Contains(response.Key))
                {
                    return response.Value;
                }
            }

            // Default response
            return "Cảm ơn bạn đã gửi tin nhắn! Tôi đang xử lý yêu cầu của bạn. Bạn có thể hỏi thêm về bất kỳ vấn đề gì khác.";
        }

        public async Task<List<ChatMessage>> GetChatHistoryAsync(string userId, int limit = 50)
        {
            return await _context.ChatMessages
                .Where(m => m.UserId == userId)
                .OrderByDescending(m => m.Timestamp)
                .Take(limit)
                .ToListAsync();
        }
    }
} 