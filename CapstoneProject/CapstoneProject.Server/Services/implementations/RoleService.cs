using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using CapstoneProject.Server.Authentication.Entities;
using CapstoneProject.Server.Models.Identity;
using CapstoneProject.Server.Services.interfaces;
using Microsoft.AspNetCore.Identity;

namespace CapstoneProject.Server.Services.implementations
{
    public class RoleService : IRoleService
    {
        private readonly RoleManager<Role> _roleManager;
        private readonly UserManager<User> _userManager;

        public RoleService(RoleManager<Role> roleManager, UserManager<User> userManager)
        {
            _roleManager = roleManager;
            _userManager = userManager;
        }

        public async Task<IEnumerable<Role>> GetAllRolesAsync()
        {
            return  _roleManager.Roles.Where(r => r.IsActive).ToList();
        }

        public async Task<Role?> GetRoleByIdAsync(Guid roleId)
        {
            return await _roleManager.FindByIdAsync(roleId.ToString());
        }

        public async Task<Role?> GetRoleByNameAsync(string roleName)
        {
            return await _roleManager.FindByNameAsync(roleName);
        }

        public async Task<bool> CreateRoleAsync(string roleName, string? description = null)
        {
            var role = Role.Create(roleName, description);
            var result = await _roleManager.CreateAsync(role);
            return result.Succeeded;
        }

        public async Task<bool> UpdateRoleAsync(Guid roleId, string roleName, string? description = null)
        {
            var role = await _roleManager.FindByIdAsync(roleId.ToString());
            if (role == null) return false;

            role.Name = roleName;
            role.Description = description;
            role.UpdatedAt = DateTime.UtcNow;

            var result = await _roleManager.UpdateAsync(role);
            return result.Succeeded;
        }

        public async Task<bool> DeleteRoleAsync(Guid roleId)
        {
            var role = await _roleManager.FindByIdAsync(roleId.ToString());
            if (role == null) return false;

            role.IsActive = false;
            role.UpdatedAt = DateTime.UtcNow;

            var result = await _roleManager.UpdateAsync(role);
            return result.Succeeded;
        }

        public async Task<bool> AssignRoleToUserAsync(Guid userId, string roleName)
        {
            var user = await _userManager.FindByIdAsync(userId.ToString());
            if (user == null) return false;

            var result = await _userManager.AddToRoleAsync(user, roleName);
            return result.Succeeded;
        }

        public async Task<bool> RemoveRoleFromUserAsync(Guid userId, string roleName)
        {
            var user = await _userManager.FindByIdAsync(userId.ToString());
            if (user == null) return false;

            var result = await _userManager.RemoveFromRoleAsync(user, roleName);
            return result.Succeeded;
        }

        public async Task<IEnumerable<string>> GetUserRolesAsync(Guid userId)
        {
            var user = await _userManager.FindByIdAsync(userId.ToString());
            if (user == null) return Enumerable.Empty<string>();

            return await _userManager.GetRolesAsync(user);
        }

        public async Task<IEnumerable<User>> GetUsersInRoleAsync(string roleName)
        {
            return await _userManager.GetUsersInRoleAsync(roleName);
        }
    }
}