using Microsoft.AspNetCore.SignalR;
using CapstoneProject.Server.Models;
using CapstoneProject.Server.Models.Chat;
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
            Console.WriteLine($"Nhận tin nhắn từ user '{user}': {message}");

            // Tạo SessionId mới nếu user chưa có session
            if (!_userSessions.ContainsKey(user))
            {
                _userSessions[user] = Guid.NewGuid().ToString();
            }

            string sessionId = _userSessions[user];

            var request = new SendMessageRequest
            {
                Message = message,
                UserId = user,
                SessionId = sessionId
            };

            var response = await _chatService.SendMessageWithRAGAsync(request);

            await Clients.Caller.SendAsync("ReceiveMessage", "ChatGPT", response.Message);
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