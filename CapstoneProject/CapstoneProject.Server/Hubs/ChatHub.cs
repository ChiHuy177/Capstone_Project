using Microsoft.AspNetCore.SignalR;
using CapstoneProject.Server.Models;
using CapstoneProject.Server.Services;

namespace CapstoneProject.Server.Hubs
{
    public class ChatHub : Hub
    {
        private readonly IChatService _chatService;

        public ChatHub(IChatService chatService)
        {
            _chatService = chatService;
        }

        public async Task SendMessage(string user, string message)
        {
            // Lưu tin nhắn user vào database
            var userMessage = new ChatMessage
            {
                UserId = user,
                Message = message,
                IsUserMessage = true,
                Timestamp = DateTime.UtcNow
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
                Timestamp = DateTime.UtcNow
            };
            
            await _chatService.SaveMessageAsync(botMessage);

            // Gửi response về cho user
            await Clients.Caller.SendAsync("ReceiveMessage", "ChatGPT", chatGptResponse);
        }

        public async Task JoinChat(string user)
        {
            await Clients.All.SendAsync("UserJoined", user);
        }

        public override async Task OnConnectedAsync()
        {
            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            await base.OnDisconnectedAsync(exception);
        }
    }
} 