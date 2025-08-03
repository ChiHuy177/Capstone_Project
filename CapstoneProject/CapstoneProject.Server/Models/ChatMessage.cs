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
        [MaxLength(2000)]
        public string Message { get; set; } = string.Empty;
        
        public bool IsUserMessage { get; set; }
        
        public DateTime Timestamp { get; set; }
        
        public string? SessionId { get; set; }
    }
} 