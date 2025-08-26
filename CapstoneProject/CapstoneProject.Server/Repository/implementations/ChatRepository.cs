using CapstoneProject.Server.Data;
using CapstoneProject.Server.Models;
using CapstoneProject.Server.Repository.interfaces;
using Microsoft.EntityFrameworkCore;

namespace CapstoneProject.Server.Repository.implementations
{
    public class ChatRepository : GenericRepository<ChatMessage>,IChatRepository
    {
        public ChatRepository(ApplicationDbContext context) : base(context)
        {
        }

        public async Task<List<ChatMessage>> GetAll(int limit = 100)
        {
            return await _context.ChatMessages
                .OrderByDescending(m => m.Timestamp)
                .Take(limit)
                .ToListAsync();
        }

        public async Task<List<ChatMessage>> GetChatHistory(string sessionID, int limit)
        {
            return await _context.ChatMessages
                .Where(m => m.SessionId == sessionID)
                .OrderBy(m => m.Timestamp)
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

        public async Task<long> GetNumberOfMessagesAsync()
        {
            return await _context.ChatMessages.CountAsync();
        }

        public async Task<List<string>> GetUserSession(string userID)
        {
            return await _context.ChatMessages
                .Where(m => m.UserId == userID && m.SessionId != null)
                .Select(m => m.SessionId!)
                .Distinct()
                .ToListAsync();
        }
    }
}
