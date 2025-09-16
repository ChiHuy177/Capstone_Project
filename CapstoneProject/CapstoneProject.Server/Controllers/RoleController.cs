using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using CapstoneProject.Server.Models;
using CapstoneProject.Server.Services.interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Components;
using Microsoft.AspNetCore.Mvc;


namespace CapstoneProject.Server.Controllers
{
    [ApiController]
    [Microsoft.AspNetCore.Mvc.Route("api/[controller]")]
    [Authorize(Roles = "Admin")]
    public class RoleController : ControllerBase
    {
        private readonly IRoleService _roleService;

        public RoleController(IRoleService roleService)
        {
            _roleService = roleService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAllRoles()
        {
            var roles = await _roleService.GetAllRolesAsync();
            return Ok(roles);
        }

        [HttpGet("{roleId}")]
        public async Task<IActionResult> GetRoleById(Guid roleId)
        {
            var role = await _roleService.GetRoleByIdAsync(roleId);
            if (role == null) return NotFound();
            return Ok(role);
        }

        [HttpPost]
        public async Task<IActionResult> CreateRole([FromBody] CreateRoleRequest request)
        {
            var result = await _roleService.CreateRoleAsync(request.Name, request.Description);
            return result ? Ok() : BadRequest("Failed to create role");
        }

        [HttpPut("{roleId}")]
        public async Task<IActionResult> UpdateRole(Guid roleId, [FromBody] UpdateRoleRequest request)
        {
            var result = await _roleService.UpdateRoleAsync(roleId, request.Name, request.Description);
            return result ? Ok() : BadRequest("Failed to update role");
        }

        [HttpDelete("{roleId}")]
        public async Task<IActionResult> DeleteRole(Guid roleId)
        {
            var result = await _roleService.DeleteRoleAsync(roleId);
            return result ? Ok() : BadRequest("Failed to delete role");
        }

        [HttpPost("assign")]
        public async Task<IActionResult> AssignRoleToUser([FromBody] AssignRoleRequest request)
        {
            var result = await _roleService.AssignRoleToUserAsync(request.UserId, request.RoleName);
            return result ? Ok() : BadRequest("Failed to assign role");
        }

        [HttpPost("remove")]
        public async Task<IActionResult> RemoveRoleFromUser([FromBody] RemoveRoleRequest request)
        {
            var result = await _roleService.RemoveRoleFromUserAsync(request.UserId, request.RoleName);
            return result ? Ok() : BadRequest("Failed to remove role");
        }

        [HttpGet("user/{userId}")]
        public async Task<IActionResult> GetUserRoles(Guid userId)
        {
            var roles = await _roleService.GetUserRolesAsync(userId);
            return Ok(roles);
        }

        [HttpGet("users/{roleName}")]
        public async Task<IActionResult> GetUsersInRole(string roleName)
        {
            var users = await _roleService.GetUsersInRoleAsync(roleName);
            return Ok(users);
        }
    }
}