using Microsoft.AspNetCore.Mvc;
using CapstoneProject.Server.Services.interfaces;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace CapstoneProject.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize] // Chỉ user đã đăng nhập mới có thể truy cập
    public class ConfigController : ControllerBase
    {
        private readonly IUserConfigService _userConfigService;

        public ConfigController(IUserConfigService userConfigService)
        {
            _userConfigService = userConfigService;
        }

        private Guid GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null)
            {
                throw new UnauthorizedAccessException("User ID not found in token");
            }
            return Guid.Parse(userIdClaim.Value);
        }

        [HttpGet]
        public async Task<IActionResult> GetAllConfigs()
        {
            try
            {
                var userId = GetCurrentUserId();
                var configs = await _userConfigService.GetUserConfigsAsync(userId);
                return Ok(configs);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi khi lấy cấu hình", error = ex.Message });
            }
        }

        [HttpGet("{key}")]
        public async Task<IActionResult> GetConfig(string key)
        {
            try
            {
                var userId = GetCurrentUserId();
                var config = await _userConfigService.GetUserConfigAsync(userId, key);
                if (config == null)
                {
                    return NotFound(new { message = $"Không tìm thấy cấu hình với key: {key}" });
                }
                return Ok(config);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi khi lấy cấu hình", error = ex.Message });
            }
        }

        [HttpPut]
        public async Task<IActionResult> UpdateConfig([FromBody] UpdateConfigRequest request)
        {
            try
            {
                Console.WriteLine($"UpdateConfig called with: {System.Text.Json.JsonSerializer.Serialize(request)}");

                if (string.IsNullOrEmpty(request.Key) || string.IsNullOrEmpty(request.Value))
                {
                    Console.WriteLine("Validation failed: Key or Value is empty");
                    return BadRequest(new { message = "Key và Value không được để trống" });
                }

                var userId = GetCurrentUserId();
                Console.WriteLine($"User ID: {userId}");

                await _userConfigService.SetUserConfigValueAsync(
                    userId,
                    request.Key,
                    request.Value,
                    request.Description,
                    request.IsEncrypted
                );

                return Ok(new { message = "Cấu hình đã được cập nhật thành công" });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in UpdateConfig: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                return StatusCode(500, new { message = "Lỗi khi cập nhật cấu hình", error = ex.Message });
            }
        }

        [HttpDelete("{key}")]
        public async Task<IActionResult> DeleteConfig(string key)
        {
            try
            {
                var userId = GetCurrentUserId();
                var result = await _userConfigService.DeleteUserConfigAsync(userId, key);
                if (!result)
                {
                    return NotFound(new { message = $"Không tìm thấy cấu hình với key: {key}" });
                }

                return Ok(new { message = "Cấu hình đã được xóa thành công" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi khi xóa cấu hình", error = ex.Message });
            }
        }
    }

    public class UpdateConfigRequest
    {
        public string Key { get; set; } = string.Empty;
        public string Value { get; set; } = string.Empty;
        public string? Description { get; set; }
        public bool IsEncrypted { get; set; } = false;
    }
}
