using CapstoneProject.Server.Data;
using CapstoneProject.Server.Models;
using CapstoneProject.Server.Services.interfaces;
using Microsoft.EntityFrameworkCore;

namespace CapstoneProject.Server.Services.implementations
{
    public class UserConfigService : IUserConfigService
    {
        private readonly ApplicationDbContext _context;

        public UserConfigService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<Dictionary<string, string>> GetUserConfigsAsync(Guid userId)
        {
            var configs = await _context.UserConfigs
                .Where(c => c.UserId == userId)
                .ToListAsync();
            return configs.ToDictionary(c => c.Key, c => c.Value);
        }

        public async Task<string?> GetUserConfigValueAsync(Guid userId, string key)
        {
            var config = await _context.UserConfigs
                .FirstOrDefaultAsync(c => c.UserId == userId && c.Key == key);
            return config?.Value;
        }

        public async Task SetUserConfigValueAsync(Guid userId, string key, string value, string? description = null, bool isEncrypted = false)
        {
            var existingConfig = await _context.UserConfigs
                .FirstOrDefaultAsync(c => c.UserId == userId && c.Key == key);

            if (existingConfig != null)
            {
                existingConfig.Value = value;
                existingConfig.UpdatedAt = DateTime.UtcNow;
                if (!string.IsNullOrEmpty(description))
                {
                    existingConfig.Description = description;
                }
                existingConfig.IsEncrypted = isEncrypted;
            }
            else
            {
                var newConfig = new UserConfig
                {
                    UserId = userId,
                    Key = key,
                    Value = value,
                    Description = description ?? string.Empty,
                    IsEncrypted = isEncrypted,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                _context.UserConfigs.Add(newConfig);
            }

            await _context.SaveChangesAsync();
        }

        public async Task<UserConfig?> GetUserConfigAsync(Guid userId, string key)
        {
            return await _context.UserConfigs
                .FirstOrDefaultAsync(c => c.UserId == userId && c.Key == key);
        }

        public async Task<bool> DeleteUserConfigAsync(Guid userId, string key)
        {
            var config = await _context.UserConfigs
                .FirstOrDefaultAsync(c => c.UserId == userId && c.Key == key);

            if (config != null)
            {
                _context.UserConfigs.Remove(config);
                await _context.SaveChangesAsync();
                return true;
            }

            return false;
        }
    }
}

