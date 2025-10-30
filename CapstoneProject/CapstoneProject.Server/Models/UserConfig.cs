using CapstoneProject.Server.Authentication.Entities;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CapstoneProject.Server.Models
{
    public class UserConfig
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public Guid UserId { get; set; }

        [Required]
        [MaxLength(100)]
        public string Key { get; set; } = string.Empty;

        [Required]
        [MaxLength(2000)]
        public string Value { get; set; } = string.Empty;

        [Required]
        public string Prompt { get; set; } = string.Empty;

        [MaxLength(500)]
        public string Description { get; set; } = string.Empty;

        public bool IsEncrypted { get; set; } = false;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation property
        [ForeignKey("UserId")]
        public virtual User User { get; set; } = null!;
    }
}

