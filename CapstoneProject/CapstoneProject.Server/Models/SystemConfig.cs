using System.ComponentModel.DataAnnotations;

namespace CapstoneProject.Server.Models
{
    public class SystemConfig
    {
        [Key]
        public string Key { get; set; } = string.Empty;

        public string Value { get; set; } = string.Empty;

        public string Description { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        public bool IsEncrypted { get; set; } = false;
    }
}
