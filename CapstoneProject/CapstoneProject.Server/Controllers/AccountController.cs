using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using CapstoneProject.Server.Authentication.Requests;
using CapstoneProject.Server.Services.interfaces;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Identity;
using CapstoneProject.Server.Authentication.Entities;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Google;

namespace CapstoneProject.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AccountController : ControllerBase
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
        public async Task<IActionResult> RefreshToken()
        {
            var refreshToken = HttpContext.Request.Cookies["REFRESH_TOKEN"];
            await _accountService.RefreshTokenAsync(refreshToken);
            return new OkObjectResult(new { user = new { } });
        }

        [HttpPost("logout")]
        public async Task<IActionResult> Logout()
        {
            var userId = HttpContext?.User?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (!string.IsNullOrEmpty(userId))
            {
                await _accountService.LogoutAsync(userId);
            }
            HttpContext?.Response.Cookies.Append("ACCESS_TOKEN", "", new CookieOptions { HttpOnly = true, Secure = true, Expires = DateTimeOffset.UnixEpoch, Path = "/" });
            HttpContext?.Response.Cookies.Append("REFRESH_TOKEN", "", new CookieOptions { HttpOnly = true, Secure = true, Expires = DateTimeOffset.UnixEpoch, Path = "/" });
            return new OkResult();
        }

        [HttpGet("me")]
        [Authorize]
        public IActionResult Me()
        {
            var userId = User?.FindFirst(JwtRegisteredClaimNames.Sub)?.Value
                         ?? User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            var email = User?.FindFirst(ClaimTypes.Email)?.Value;
            var fullName = User?.FindFirst(ClaimTypes.Name)?.Value;

            if (string.IsNullOrEmpty(userId))
            {
                // return new OkObjectResult(new {
                //     huy = "HUY"
                // });
                return new UnauthorizedResult();
            }

            return new OkObjectResult(new
            {
                id = userId,
                email,
                name = email,
                fullName,
            });
        }

        [HttpGet("login/google")]
        public IResult GoogleLogin([FromQuery] string returnUrl,
            LinkGenerator linkGenerator, SignInManager<User> signInManager)
        {
            var httpContext = HttpContext;
            var properties = signInManager.ConfigureExternalAuthenticationProperties("Google",
                linkGenerator.GetPathByName(httpContext, "GoogleCallback") + $"?returnUrl={returnUrl}");

            return Results.Challenge(properties, ["Google"]);
        }

        [HttpGet]
        [Route("login/google/callback", Name = "GoogleCallback")]
        public async Task<IResult> GoogleResponse([FromQuery] string returnUrl,
            IAccountService accountService)
        {
            var httpContext = HttpContext;
            var result = await httpContext.AuthenticateAsync(GoogleDefaults.AuthenticationScheme);

            if (!result.Succeeded)
            {
                return Results.Unauthorized();
            }

            await accountService.LoginWithGoogleAsync(result.Principal);

            return Results.Redirect(returnUrl);
        }
    }
}