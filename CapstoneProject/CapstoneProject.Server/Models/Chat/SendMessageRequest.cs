using System.ComponentModel.DataAnnotations;

namespace CapstoneProject.Server.Models.Chat
{
    public class SendMessageRequest
    {
        [Required(ErrorMessage = "Message là bắt buộc")]
        [MinLength(1, ErrorMessage = "Message không được rỗng")]
        [MaxLength(5000, ErrorMessage = "Message không được quá 5000 ký tự")]
        public string Message { get; set; } = string.Empty;

        public string? SessionId { get; set; }

        public string? UserId { get; set; }

        [Range(2020, 2030, ErrorMessage = "Year phải từ 2020 đến 2030")]
        public int? Year { get; set; }
    }
}
