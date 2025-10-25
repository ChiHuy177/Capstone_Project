using CapstoneProject.Server.Data;
using CapstoneProject.Server.Models;
using CapstoneProject.Server.Services.interfaces;
using Microsoft.EntityFrameworkCore;

namespace CapstoneProject.Server.Services.implementations
{
    public class ConfigService : IConfigService
    {
        private readonly ApplicationDbContext _context;

        public ConfigService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<Dictionary<string, string>> GetAllConfigsAsync()
        {
            var configs = await _context.SystemConfigs.ToListAsync();
            return configs.ToDictionary(c => c.Key, c => c.Value);
        }

        public async Task<string?> GetConfigValueAsync(string key)
        {
            var config = await _context.SystemConfigs
                .FirstOrDefaultAsync(c => c.Key == key);
            return config?.Value;
        }

        public async Task SetConfigValueAsync(string key, string value, string? description = null, bool isEncrypted = false)
        {
            var existingConfig = await _context.SystemConfigs
                .FirstOrDefaultAsync(c => c.Key == key);

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
                var newConfig = new SystemConfig
                {
                    Key = key,
                    Value = value,
                    Description = description ?? string.Empty,
                    IsEncrypted = isEncrypted,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                _context.SystemConfigs.Add(newConfig);
            }

            await _context.SaveChangesAsync();
        }

        public async Task<SystemConfig?> GetConfigAsync(string key)
        {
            return await _context.SystemConfigs
                .FirstOrDefaultAsync(c => c.Key == key);
        }

        public async Task<bool> DeleteConfigAsync(string key)
        {
            var config = await _context.SystemConfigs
                .FirstOrDefaultAsync(c => c.Key == key);

            if (config != null)
            {
                _context.SystemConfigs.Remove(config);
                await _context.SaveChangesAsync();
                return true;
            }

            return false;
        }
    }
}
