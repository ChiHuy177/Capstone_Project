using CapstoneProject.Server.Models;

namespace CapstoneProject.Server.Services.interfaces
{
    public interface IUserConfigService
    {
        Task<Dictionary<string, string>> GetUserConfigsAsync(Guid userId);
        Task<string?> GetUserConfigValueAsync(Guid userId, string key);
        Task SetUserConfigValueAsync(Guid userId, string key, string value, string? description = null, bool isEncrypted = false);
        Task<UserConfig?> GetUserConfigAsync(Guid userId, string key);
        Task<bool> DeleteUserConfigAsync(Guid userId, string key);
    }
}

