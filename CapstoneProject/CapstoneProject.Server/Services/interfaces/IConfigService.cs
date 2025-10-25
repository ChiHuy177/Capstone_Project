using CapstoneProject.Server.Models;

namespace CapstoneProject.Server.Services.interfaces
{
    public interface IConfigService
    {
        Task<Dictionary<string, string>> GetAllConfigsAsync();
        Task<string?> GetConfigValueAsync(string key);
        Task SetConfigValueAsync(string key, string value, string? description = null, bool isEncrypted = false);
        Task<SystemConfig?> GetConfigAsync(string key);
        Task<bool> DeleteConfigAsync(string key);
    }
}
