using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using CapstoneProject.Server.Services.interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CapstoneProject.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class AnalysticsController : ControllerBase
    {
        private readonly IHourlyCountService _hourlyCountService;
        public AnalysticsController(IHourlyCountService hourlyCountService)
        {
            _hourlyCountService = hourlyCountService;
        }

        [HttpGet]
        [Route("hourlycounts", Name = "GetHourlyCounts")]
        public async Task<IActionResult> GetHourlyCounts()
        {
            var result = await _hourlyCountService.GetAllAsync();
            return Ok(result);
        }

    }
}