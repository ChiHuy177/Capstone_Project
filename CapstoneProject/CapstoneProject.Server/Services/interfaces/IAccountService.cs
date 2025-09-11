using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using CapstoneProject.Server.Authentication.Requests;
using Microsoft.AspNetCore.Authentication;

namespace CapstoneProject.Server.Services.interfaces
{
    public interface IAccountService
    {
        Task RegisterAsync(RegisterRequest registerRequest);
        Task LoginAsync(LoginRequest loginRequest);
        Task RefreshTokenAsync(string? refreshToken);
        Task LogoutAsync(string userId);
        Task LoginWithGoogleAsync(ClaimsPrincipal? claimsPrincipal);
    }
}