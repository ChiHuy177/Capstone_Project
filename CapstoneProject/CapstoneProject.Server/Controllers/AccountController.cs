using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using CapstoneProject.Server.Authentication.Requests;
using CapstoneProject.Server.Services.interfaces;
using Microsoft.AspNetCore.Mvc;

namespace CapstoneProject.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AccountController
    {
        private readonly IAccountService _accountService;

        public AccountController(IAccountService accountService)
        {
            _accountService = accountService;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register(RegisterRequest registerRequest)
        {
            await _accountService.RegisterAsync(registerRequest);
            return new OkResult();
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login(LoginRequest loginRequest)
        {
            await _accountService.LoginAsync(loginRequest);
            return new OkResult();
        }

        [HttpPost("refresh-token")]
        public async Task<IActionResult> RefreshToken(HttpContext httpContext)
        {
            var refreshToken = httpContext.Request.Cookies["refreshToken"];
            await _accountService.RefreshTokenAsync(refreshToken);
            return new OkResult();
        }

        

    }
}