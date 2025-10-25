using Microsoft.AspNetCore.Mvc;
using CapstoneProject.Server.Services.interfaces;
using Microsoft.AspNetCore.Authorization;

namespace CapstoneProject.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize] // Chỉ user đã đăng nhập mới có thể truy cập
    public class ConfigController : ControllerBase
    {
        private readonly IConfigService _configService;

        public ConfigController(IConfigService configService)
        {
            _configService = configService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAllConfigs()
        {
            try
            {
                var configs = await _configService.GetAllConfigsAsync();
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
                var config = await _configService.GetConfigAsync(key);
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
                if (string.IsNullOrEmpty(request.Key) || string.IsNullOrEmpty(request.Value))
                {
                    return BadRequest(new { message = "Key và Value không được để trống" });
                }

                await _configService.SetConfigValueAsync(
                    request.Key,
                    request.Value,
                    request.Description,
                    request.IsEncrypted
                );

                return Ok(new { message = "Cấu hình đã được cập nhật thành công" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi khi cập nhật cấu hình", error = ex.Message });
            }
        }

        [HttpDelete("{key}")]
        public async Task<IActionResult> DeleteConfig(string key)
        {
            try
            {
                var result = await _configService.DeleteConfigAsync(key);
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
