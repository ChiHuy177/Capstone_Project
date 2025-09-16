using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using CapstoneProject.Server.Authentication.Entities;
using CapstoneProject.Server.Models.Identity;

namespace CapstoneProject.Server.Services.interfaces
{
    public interface IRoleService
    {
        Task<IEnumerable<Role>> GetAllRolesAsync();
        Task<Role?> GetRoleByIdAsync(Guid roleId);
        Task<Role?> GetRoleByNameAsync(string roleName);
        Task<bool> CreateRoleAsync(string roleName, string? description = null);
        Task<bool> UpdateRoleAsync(Guid roleId, string roleName, string? description = null);
        Task<bool> DeleteRoleAsync(Guid roleId);
        Task<bool> AssignRoleToUserAsync(Guid userId, string roleName);
        Task<bool> RemoveRoleFromUserAsync(Guid userId, string roleName);
        Task<IEnumerable<string>> GetUserRolesAsync(Guid userId);
        Task<IEnumerable<User>> GetUsersInRoleAsync(string roleName);
    }
}