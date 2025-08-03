using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using CapstoneProject.Server.Data;
using CapstoneProject.Server.Services;
using CapstoneProject.Server.Hubs;

namespace CapstoneProject.Server
{
    public class Program
    {
        public static void Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);

            // Add services to the container.
            builder.Services.AddControllers();
            
            // Add SignalR
            builder.Services.AddSignalR();
            
            // Add Database
            var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
            builder.Services.AddDbContext<ApplicationDbContext>(options =>
                options.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString)));
            
            // Add Services
            builder.Services.AddScoped<IChatService, ChatService>();
            
            // Add CORS for SignalR
            builder.Services.AddCors(options =>
            {
                options.AddPolicy("AllowAll", policy =>
                {
                    policy.WithOrigins("https://localhost:54410", "http://localhost:54410")
                          .AllowAnyMethod()
                          .AllowAnyHeader()
                          .AllowCredentials();
                });
            });

            // Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
            builder.Services.AddOpenApi();

            var app = builder.Build();

            app.UseDefaultFiles();
            app.MapStaticAssets();

            // Configure the HTTP request pipeline.
            if (app.Environment.IsDevelopment())
            {
                app.MapOpenApi();
            }

            app.UseHttpsRedirection();
            
            // Use CORS
            app.UseCors("AllowAll");

            app.UseAuthorization();

            app.MapControllers();
            
            // Map SignalR Hub
            app.MapHub<ChatHub>("/chatHub");

            app.MapFallbackToFile("/index.html");

            app.Run();
        }
    }
}
