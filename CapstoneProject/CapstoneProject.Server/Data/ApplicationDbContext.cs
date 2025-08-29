using Microsoft.EntityFrameworkCore;
using CapstoneProject.Server.Models;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using CapstoneProject.Server.Authentication.Entities;
using Microsoft.AspNetCore.Identity;

namespace CapstoneProject.Server.Data
{
    public class ApplicationDbContext : IdentityDbContext<User, IdentityRole<Guid>, Guid>
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        public DbSet<ChatMessage> ChatMessages { get; set; }

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

            modelBuilder.Entity<User>().Property(u => u.FirstName).HasMaxLength(256);
            modelBuilder.Entity<User>().Property(u => u.LastName).HasMaxLength(256);
        }
    }
} 