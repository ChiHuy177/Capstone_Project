using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Identity;

namespace CapstoneProject.Server.Models.Identity
{
    public class Role : IdentityRole<Guid>
    {
        public string? Description { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
        public bool IsActive { get; set; } = true;
        
        public static Role Create(string name, string? description = null)
        {
            return new Role
            {
                Name = name,
                NormalizedName = name.ToUpper(),
                Description = description,
                CreatedAt = DateTime.UtcNow,
                IsActive = true
            };
        }
    }
}