using Microsoft.AspNetCore.Mvc;
using CapstoneProject.Server.Services;
using CapstoneProject.Server.Models;
using CapstoneProject.Server.Models.Chat;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using System.Text.Json;

namespace CapstoneProject.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ChatController : ControllerBase
    {
        private readonly IChatService _chatService;
        private readonly ILogger<ChatController> _logger;

        public ChatController(IChatService chatService, ILogger<ChatController> logger)
        {
            _chatService = chatService;
            _logger = logger;
        }

        /// <summary>
        /// Gửi tin nhắn và nhận response từ AI với RAG (Streaming)
        /// </summary>
        [HttpPost("stream")]
        public async Task StreamMessage([FromBody] SendMessageRequest request, CancellationToken cancellationToken)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            request.UserId = userId;

            _logger.LogInformation(
                "StreamMessage request - UserId: {UserId}, SessionId: {SessionId}",
                userId, request.SessionId);

            Response.ContentType = "text/event-stream";
            Response.Headers.Append("Cache-Control", "no-cache");
            Response.Headers.Append("Connection", "keep-alive");

            try
            {
                await foreach (var chunk in _chatService.StreamMessageWithRAGAsync(request, cancellationToken))
                {
                    if (cancellationToken.IsCancellationRequested)
                        break;

                    var json = JsonSerializer.Serialize(chunk, new JsonSerializerOptions
                    {
                        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
                    });

                    await Response.WriteAsync($"data: {json}\n\n", cancellationToken);
                    await Response.Body.FlushAsync(cancellationToken);
                }
            }
            catch (OperationCanceledException)
            {
                _logger.LogInformation("Streaming cancelled by client");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in StreamMessage");
                var errorChunk = JsonSerializer.Serialize(new StreamChunk
                {
                    Type = "error",
                    Error = "Đã xảy ra lỗi khi xử lý tin nhắn"
                });
                await Response.WriteAsync($"data: {errorChunk}\n\n", cancellationToken);
            }
        }

        /// <summary>
        /// Gửi tin nhắn và nhận response từ AI với RAG (Non-streaming)
        /// </summary>
        [HttpPost("send")]
        public async Task<ActionResult<SendMessageResponse>> SendMessage([FromBody] SendMessageRequest request)
        {
            try
            {
                // Lấy userId từ token nếu có
                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                request.UserId = userId;

                _logger.LogInformation(
                    "SendMessage request - UserId: {UserId}, SessionId: {SessionId}, Year: {Year}",
                    userId, request.SessionId, request.Year);

                var response = await _chatService.SendMessageWithRAGAsync(request);
                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in SendMessage");
                return StatusCode(500, new SendMessageResponse
                {
                    Success = false,
                    Error = "Đã xảy ra lỗi khi xử lý tin nhắn",
                    Message = "Tôi chưa được cập nhật thông tin này, hãy liên hệ với email của EIU để tìm hiểu thêm bạn nhé!"
                });
            }
        }

        [HttpGet("history/{userId}")]
        public async Task<ActionResult<List<ChatMessage>>> GetChatHistory(string userId, [FromQuery] int limit = 50)
        {
            try
            {
                var history = await _chatService.GetChatHistoryAsync(userId, limit);
                return Ok(history);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpGet("session/{sessionId}")]
        public async Task<ActionResult<List<ChatMessage>>> GetChatHistoryBySession(string sessionId, [FromQuery] int limit = 50)
        {
            try
            {
                var history = await _chatService.GetChatHistoryBySessionAsync(sessionId, limit);
                return Ok(history);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpGet("sessions/{userId}")]
        public async Task<ActionResult<List<string>>> GetUserSessions(string userId)
        {
            try
            {
                var sessions = await _chatService.GetUserSessionsAsync(userId);
                return Ok(sessions);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpGet("messages")]
        public async Task<ActionResult<List<ChatMessage>>> GetAllMessages([FromQuery] int limit = 100)
        {
            try
            {
                var messages = await _chatService.GetAllMessagesAsync(limit);
                return Ok(messages);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpGet("count")]
        public async Task<ActionResult<object>> CountMessages()
        {
            try
            {
                var result = await _chatService.GetNumberOfMessagesAsync();
                return Ok(result);

            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }
    }
} 