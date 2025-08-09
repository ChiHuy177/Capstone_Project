using System.ComponentModel.DataAnnotations;

namespace CapstoneProject.Server.Models
{
    public class ChatMessage
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(100)]
        public string UserId { get; set; } = string.Empty;

        [Required]
        [MaxLength(20000)]
        public string Message { get; set; } = string.Empty;

        public bool IsUserMessage { get; set; }

        public DateTime Timestamp { get; set; }

        public string? SessionId { get; set; }
    }
    
    public class OpenAIResponse
    {
        public List<Choice> choices { get; set; } = new();
    }

    public class Choice
    {
        public Message message { get; set; } = new();
    }

    public class Message
    {
        public string content { get; set; } = string.Empty;
    }
}