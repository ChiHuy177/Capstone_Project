using Microsoft.EntityFrameworkCore;
using CapstoneProject.Server.Models;

namespace CapstoneProject.Server.Data
{
    public class ApplicationDbContext : DbContext
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
        }
    }
} 