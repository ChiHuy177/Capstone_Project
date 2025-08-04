using Microsoft.AspNetCore.SignalR;
using CapstoneProject.Server.Models;
using CapstoneProject.Server.Services;

namespace CapstoneProject.Server.Hubs
{
    public class ChatHub : Hub
    {
        private readonly IChatService _chatService;
        private static readonly Dictionary<string, string> _userSessions = new();

        public ChatHub(IChatService chatService)
        {
            _chatService = chatService;
        }

        public async Task SendMessage(string user, string message)
        {
            // Tạo SessionId mới nếu user chưa có session
            if (!_userSessions.ContainsKey(user))
            {
                _userSessions[user] = Guid.NewGuid().ToString();
            }
            
            string sessionId = _userSessions[user];

            // Lưu tin nhắn user vào database
            var userMessage = new ChatMessage
            {
                UserId = user,
                Message = message,
                IsUserMessage = true,
                Timestamp = DateTime.UtcNow,
                SessionId = sessionId
            };
            
            await _chatService.SaveMessageAsync(userMessage);

            // Gửi tin nhắn đến tất cả clients
            await Clients.All.SendAsync("ReceiveMessage", user, message);

            // Xử lý tin nhắn với ChatGPT (mock)
            var chatGptResponse = await _chatService.GetChatGptResponseAsync(message);
            
            // Lưu response của ChatGPT vào database
            var botMessage = new ChatMessage
            {
                UserId = "ChatGPT",
                Message = chatGptResponse,
                IsUserMessage = false,
                Timestamp = DateTime.UtcNow,
                SessionId = sessionId
            };
            
            await _chatService.SaveMessageAsync(botMessage);

            // Gửi response về cho user
            await Clients.Caller.SendAsync("ReceiveMessage", "ChatGPT", chatGptResponse);
        }

        public async Task JoinChat(string user)
        {
            // Tạo SessionId mới khi user join chat
            _userSessions[user] = Guid.NewGuid().ToString();
            
            await Clients.All.SendAsync("UserJoined", user);
        }

        public async Task StartNewSession(string user)
        {
            // Tạo SessionId mới cho user
            _userSessions[user] = Guid.NewGuid().ToString();
            
            await Clients.Caller.SendAsync("SessionStarted", _userSessions[user]);
        }

        public override async Task OnConnectedAsync()
        {
            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            // Có thể xóa session khi user disconnect nếu cần
            await base.OnDisconnectedAsync(exception);
        }
    }
} 