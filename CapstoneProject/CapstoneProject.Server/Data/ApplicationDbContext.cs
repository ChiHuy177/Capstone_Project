using Microsoft.EntityFrameworkCore;
using CapstoneProject.Server.Models;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using CapstoneProject.Server.Authentication.Entities;
using Microsoft.AspNetCore.Identity;
using CapstoneProject.Server.Models.Analytics;
using CapstoneProject.Server.Models.Identity;

namespace CapstoneProject.Server.Data
{
    public class ApplicationDbContext : IdentityDbContext<User, Role, Guid>
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        public DbSet<ChatMessage> ChatMessages { get; set; }

        public DbSet<User> AppUsers { get; set; }

        public DbSet<HourlyCount> HourlyCounts { get; set; }

        public DbSet<SystemConfig> SystemConfigs { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<ChatMessage>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.UserId).IsRequired().HasMaxLength(100);
                entity.Property(e => e.Message).IsRequired().HasMaxLength(10000);
                entity.Property(e => e.Timestamp).IsRequired();
                entity.Property(e => e.IsUserMessage).IsRequired();
            });

            modelBuilder.Entity<User>(entity =>
            {
                entity.Property(u => u.FullName).HasMaxLength(256);
                entity.Property(u => u.CreatedAt).IsRequired();
                entity.Property(u => u.IsActive).HasDefaultValue(true);
            });

            modelBuilder.Entity<Role>(entity =>
            {
                entity.Property(r => r.Name).HasMaxLength(256).IsRequired();
                entity.Property(r => r.Description).HasMaxLength(500);
                entity.Property(r => r.CreatedAt).IsRequired();
                entity.Property(r => r.IsActive).HasDefaultValue(true);
            });

            modelBuilder.Entity<SystemConfig>(entity =>
            {
                entity.HasKey(e => e.Key);
                entity.Property(e => e.Key).HasMaxLength(100).IsRequired();
                entity.Property(e => e.Value).HasMaxLength(2000).IsRequired();
                entity.Property(e => e.Description).HasMaxLength(500);
                entity.Property(e => e.CreatedAt).IsRequired();
                entity.Property(e => e.UpdatedAt).IsRequired();
                entity.Property(e => e.IsEncrypted).HasDefaultValue(false);
            });
            var roleAdminId = new Guid("A3E0A2C9-4BDF-4F9E-9D6C-2E2E7D5C6A11");
            var roleUserId = new Guid("B4F1B3DA-5CEA-41AA-AB77-9C9C3F7D8B22");

            modelBuilder.Entity<Role>().HasData(
                new Role
                {
                    Id = roleAdminId,
                    Name = "Admin",
                    NormalizedName = "ADMIN" // nên set để match unique index
                    // ConcurrencyStamp = Guid.NewGuid().ToString() // KHÔNG bắt buộc
                },
                new Role
                {
                    Id = roleUserId,
                    Name = "User",
                    NormalizedName = "USER"
                }
            );

        }
    }
}