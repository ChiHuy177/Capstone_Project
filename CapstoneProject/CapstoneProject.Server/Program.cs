using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using CapstoneProject.Server.Data;
using CapstoneProject.Server.Services;
using CapstoneProject.Server.Hubs;
using CapstoneProject.Server.Repository.interfaces;
using CapstoneProject.Server.Repository.implementations;
using System.Reflection;
using CapstoneProject.Server.Services.implementations;
using CapstoneProject.Server.Services.interfaces;
using Scalar.AspNetCore;
using Microsoft.AspNetCore.Identity;
using CapstoneProject.Server.Authentication.Entities;

namespace CapstoneProject.Server
{
    public class Program
    {
        public static void Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);

            builder.Configuration.AddEnvironmentVariables();

            // Add services to the container.
            builder.Services.AddControllers();

            // Add SignalR
            builder.Services.AddSignalR();

            

            // Add Services
            builder.Services.AddScoped(typeof(IGenericRepository<>), typeof(GenericRepository<>));
            builder.Services.Scan(scan => scan
                .FromAssemblies(Assembly.GetExecutingAssembly())

                .AddClasses(classes => classes.Where(type => type.Name.EndsWith("Repository")))
                    .AsMatchingInterface()
                    .WithScopedLifetime()

                .AddClasses(classes => classes.Where(type => type.Name.EndsWith("Service")))
                    .AsMatchingInterface()
                    .WithScopedLifetime()
            );

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

            builder.Services.AddSingleton<IKnowledgeService, KnowledgeService>();

            // Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
            builder.Services.AddOpenApi();

            builder.Services.AddIdentity<User, IdentityRole<Guid>>(opt =>
            {
                opt.Password.RequireDigit = true;
                opt.Password.RequireLowercase = true;
                opt.Password.RequireNonAlphanumeric = true;
                opt.Password.RequireUppercase = true;
                opt.Password.RequiredLength = 8;
                opt.User.RequireUniqueEmail = true;
            }).AddEntityFrameworkStores<ApplicationDbContext>();

            // Add Database
            var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
            builder.Services.AddDbContext<ApplicationDbContext>(options =>
                options.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString)));

            builder.Services.AddEndpointsApiExplorer();

            var app = builder.Build();

            // Configure the HTTP request pipeline.
            app.MapOpenApi();
            app.MapScalarApiReference();

            // Map Scalar API reference FIRST - before any other routing


            app.UseHttpsRedirection();

            // Use CORS
            app.UseCors("AllowAll");

            app.UseAuthorization();

            app.MapControllers();

            // Map SignalR Hub
            app.MapHub<ChatHub>("/chatHub");

            // Map fallback to SPA AFTER all API endpoints
            app.MapFallbackToFile("/index.html");

            app.Run();
        }
    }
}
