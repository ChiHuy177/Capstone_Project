using CapstoneProject.Server.Models;

namespace CapstoneProject.Server.Services
{
    public interface IChatService
    {
        Task<ChatMessage> SaveMessageAsync(ChatMessage message);
        Task<string> GetChatGptResponseAsync(string userMessage);
        Task<List<ChatMessage>> GetChatHistoryAsync(string userId, int limit = 50);
        Task<List<ChatMessage>> GetChatHistoryBySessionAsync(string sessionId, int limit = 50);
        Task<List<ChatMessage>> GetAllMessagesAsync(int limit = 100);
        Task<List<string>> GetUserSessionsAsync(string userId);
        Task<object> GetNumberOfMessagesAsync();
    }
}