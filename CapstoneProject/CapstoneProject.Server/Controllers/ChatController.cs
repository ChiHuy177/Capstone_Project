using Microsoft.AspNetCore.Mvc;
using CapstoneProject.Server.Services;
using CapstoneProject.Server.Models;

namespace CapstoneProject.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ChatController : ControllerBase
    {
        private readonly IChatService _chatService;

        public ChatController(IChatService chatService)
        {
            _chatService = chatService;
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