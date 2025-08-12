using CapstoneProject.Server.Models;

namespace CapstoneProject.Server.Repository.interfaces
{
    public interface IChatRepository
    {
        public Task<List<ChatMessage>> GetChatHistory(string sessionID, int limit);
        public Task<List<ChatMessage>> GetAll(int limit);
        public Task<List<string>> GetUserSession(string userID);
        public Task<List<ChatMessage>> GetChatHistoryBySessionAsync(string sessionId, int limit = 50);
    }
}
