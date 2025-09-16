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
using CapstoneProject.Server.Authentication.Infrastructure.Options;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using CapstoneProject.Server.Handler;
using CapstoneProject.Server.Authentication.Infrastructure.Processor;
using Microsoft.AspNetCore.Authentication.Cookies;
using CapstoneProject.Server.Services.implementations.Analystics;
using CapstoneProject.Server.Models.Identity;

namespace CapstoneProject.Server
{
    public class Program
    {
        public static async Task Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);

            builder.Configuration.AddEnvironmentVariables();

            // Add services to the container.
            builder.Services.AddControllers();

            // Add SignalR
            builder.Services.AddSignalR();



            // Add Services
            builder.Services.AddScoped(typeof(IGenericRepository<>), typeof(GenericRepository<>));
            builder.Services.AddScoped<IAuthTokenProcessor, AuthTokenProcessor>();
            builder.Services.Scan(scan => scan
                .FromAssemblies(Assembly.GetExecutingAssembly())

                .AddClasses(classes => classes.Where(type => type.Name.EndsWith("Repository")))
                    .AsMatchingInterface()
                    .WithScopedLifetime()

                .AddClasses(classes => classes.Where(type => type.Name.EndsWith("Service")))
                    .AsMatchingInterface()
                    .WithScopedLifetime()
            );

            builder.Services.AddScoped<IHourlyCountService, HourlyCountsService>();

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

            builder.Services.Configure<JwtOptions>(
                builder.Configuration.GetSection(JwtOptions.JwtOptionsKey));

            builder.Services.AddIdentity<User, Role>(opt =>
            {
                opt.Password.RequireDigit = true;
                opt.Password.RequireLowercase = true;
                opt.Password.RequireNonAlphanumeric = true;
                opt.Password.RequireUppercase = true;
                opt.Password.RequiredLength = 8;
                opt.User.RequireUniqueEmail = true;
            }).AddEntityFrameworkStores<ApplicationDbContext>()
            .AddDefaultTokenProviders();

            builder.Services.AddAuthentication(opt =>
            {
                opt.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                opt.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
                opt.DefaultSignInScheme = JwtBearerDefaults.AuthenticationScheme;
            }).AddCookie().AddGoogle(options =>
            {
                var clientId = builder.Configuration["Authentication:Google:ClientId"];
                var clientSecret = builder.Configuration["Authentication:Google:ClientSecret"];

                if (clientId == null || clientSecret == null)
                {
                    throw new ArgumentException("Google authentication is not configured properly.");
                }

                options.ClientId = clientId;
                options.ClientSecret = clientSecret;
                options.SignInScheme = CookieAuthenticationDefaults.AuthenticationScheme;

            }).AddJwtBearer(options =>
            {
                var jwtOptions = builder.Configuration.GetSection(JwtOptions.JwtOptionsKey)
                .Get<JwtOptions>() ?? throw new ArgumentException(nameof(JwtOptions));

                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    ValidIssuer = jwtOptions.Issuer,
                    ValidAudience = jwtOptions.Audience,
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtOptions.Secret)),
                };

                options.Events = new JwtBearerEvents
                {
                    OnMessageReceived = context =>
                    {
                        context.Token = context.Request.Cookies["ACCESS_TOKEN"];
                        return Task.CompletedTask;
                    }
                };
            });

            builder.Services.AddAuthorization(options =>
            {
                options.AddPolicy("AdminOnly", policy => policy.RequireRole("Admin"));
                options.AddPolicy("UserAndAdmin", policy => policy.RequireRole("User", "Admin"));
            });

            builder.Services.AddExceptionHandler<GlobalExceptionHandler>();


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

            app.UseExceptionHandler(_ => { });
            app.UseHttpsRedirection();

            // Use CORS
            app.UseCors("AllowAll");

            app.UseAuthentication();
            app.UseAuthorization();

            app.MapControllers();

            // Map SignalR Hub
            app.MapHub<ChatHub>("/chatHub");

            // Map fallback to SPA AFTER all API endpoints
            app.MapFallbackToFile("/index.html");

            // Thêm seed data cho roles (sau khi tạo app, trước app.Run())
            using (var scope = app.Services.CreateScope())
            {
                var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<Role>>();

                var roles = new[] { "Admin", "User" };
                foreach (var roleName in roles)
                {
                    if (!await roleManager.RoleExistsAsync(roleName))
                    {
                        var role = Role.Create(roleName);
                        await roleManager.CreateAsync(role);
                    }
                }
            }

            app.Run();
        }
    }
}
