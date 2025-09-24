using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace CapstoneProject.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class TimeController : ControllerBase
    {
        [HttpGet("now")]
        public IActionResult Now()
        {
            return Ok(new { utc = DateTime.UtcNow });
        }
    }
}
