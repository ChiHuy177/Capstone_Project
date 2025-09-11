using System.Security.Claims;
using CapstoneProject.Server.Authentication.Entities;
using CapstoneProject.Server.Authentication.Exception;
using CapstoneProject.Server.Authentication.Requests;
using CapstoneProject.Server.Repository.interfaces;
using CapstoneProject.Server.Services.interfaces;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Identity;

namespace CapstoneProject.Server.Services.implementations
{
    public class AccountService : IAccountService
    {
        private readonly IAuthTokenProcessor _tokenProcessor;
        private readonly UserManager<User> _userManager;
        private readonly IAccountRepository _userRepository;

        public AccountService(IAuthTokenProcessor tokenProcessor, UserManager<User> userManager,
            IAccountRepository userRepository)
        {
            _tokenProcessor = tokenProcessor;
            _userManager = userManager;
            _userRepository = userRepository;
        }

        public async Task RegisterAsync(RegisterRequest registerRequest)
        {
            var userExist = await _userManager.FindByEmailAsync(registerRequest.Email) != null;

            if (userExist)
            {
                throw new UserAlreadyExistException(registerRequest.Email);
            }

            var newUser = User.Create(registerRequest.Email, registerRequest.FullName);

            newUser.PasswordHash = _userManager.PasswordHasher.HashPassword(newUser, registerRequest.Password);

            var result = await _userManager.CreateAsync(newUser);


            if (!result.Succeeded)
            {
                throw new RegisterFailException(result.Errors.Select(x => x.Description));
            }
        }

        public async Task LoginAsync(LoginRequest loginRequest)
        {
            var user = await _userManager.FindByEmailAsync(loginRequest.Email);

            if (user == null || !await _userManager.CheckPasswordAsync(user, loginRequest.Password))
            {
                throw new LoginFailException(loginRequest.Email);
            }

            var (jwtToken, expirationDateInUtc) = _tokenProcessor.GenerateJwtToken(user);
            var refreshTokenValue = _tokenProcessor.GenerateRefreshToken();

            var refreshTokenExpirationDateInUtc = DateTime.UtcNow.AddDays(7);

            user.RefreshToken = refreshTokenValue;
            user.RefreshTokenExpireAtUtc = refreshTokenExpirationDateInUtc;

            await _userManager.UpdateAsync(user);

            _tokenProcessor.WriteAuthTokenAsHttpOnlyCookie("ACCESS_TOKEN", jwtToken, expirationDateInUtc);
            _tokenProcessor.WriteAuthTokenAsHttpOnlyCookie("REFRESH_TOKEN", refreshTokenValue, refreshTokenExpirationDateInUtc);
        }

        public async Task RefreshTokenAsync(string? refreshToken)
        {
            if (string.IsNullOrEmpty(refreshToken))
            {
                throw new RefreshTokenInvalidException("Refresh token is missing");
            }

            var user = await _userRepository.GetUserByRefreshTokenAsync(refreshToken);

            if (user == null)
            {
                throw new RefreshTokenInvalidException("Unable to find user with the provided refresh token");
            }

            if (user.RefreshTokenExpireAtUtc < DateTime.UtcNow)
            {
                throw new RefreshTokenInvalidException("Refresh token has expired");
            }

            // Issue new access token and rotate refresh token
            var (jwtToken, accessExpireAtUtc) = _tokenProcessor.GenerateJwtToken(user);
            var newRefreshToken = _tokenProcessor.GenerateRefreshToken();
            var newRefreshExpireAtUtc = DateTime.UtcNow.AddDays(7);

            user.RefreshToken = newRefreshToken;
            user.RefreshTokenExpireAtUtc = newRefreshExpireAtUtc;
            await _userManager.UpdateAsync(user);

            _tokenProcessor.WriteAuthTokenAsHttpOnlyCookie("ACCESS_TOKEN", jwtToken, accessExpireAtUtc);
            _tokenProcessor.WriteAuthTokenAsHttpOnlyCookie("REFRESH_TOKEN", newRefreshToken, newRefreshExpireAtUtc);
        }

        public async Task LogoutAsync(string userId)
        {
            var user = await _userManager.FindByIdAsync(userId);
            if (user != null)
            {
                user.RefreshToken = null;
                user.RefreshTokenExpireAtUtc = null;
                await _userManager.UpdateAsync(user);
                _tokenProcessor.ClearAuthCookie("ACCESS_TOKEN");
                _tokenProcessor.ClearAuthCookie("REFRESH_TOKEN");
            }

        }

        public async Task LoginWithGoogleAsync(ClaimsPrincipal? claimsPrincipal)
        {
            if (claimsPrincipal == null)
            {
                throw new ExternalLoginProviderException("Google", "Failed to retrieve user information from Google.");
            }

            var email = claimsPrincipal.FindFirstValue(ClaimTypes.Email);

            if (email == null)
            {
                throw new ExternalLoginProviderException("Google", "Email claim not found.");
            }

            var existingUser = await _userManager.FindByLoginAsync("Google", email);
            if (existingUser != null)
            {
                // User already linked with Google, proceed to login
                var (jwtToken1, accessExpireAtUtc1) = _tokenProcessor.GenerateJwtToken(existingUser);
                var newRefreshToken1 = _tokenProcessor.GenerateRefreshToken();
                var newRefreshExpireAtUtc1 = DateTime.UtcNow.AddDays(7);

                existingUser.RefreshToken = newRefreshToken1;
                existingUser.RefreshTokenExpireAtUtc = newRefreshExpireAtUtc1;
                await _userManager.UpdateAsync(existingUser);

                _tokenProcessor.WriteAuthTokenAsHttpOnlyCookie("ACCESS_TOKEN", jwtToken1, accessExpireAtUtc1);
                _tokenProcessor.WriteAuthTokenAsHttpOnlyCookie("REFRESH_TOKEN", newRefreshToken1, newRefreshExpireAtUtc1);
                return;
            }



            var user = await _userManager.FindByEmailAsync(email);

            if (user == null)
            {
                var newUser = new User
                {
                    UserName = email,
                    Email = email,
                    FullName = claimsPrincipal.FindFirstValue(ClaimTypes.GivenName) ?? string.Empty,
                    EmailConfirmed = true
                };

                var result = await _userManager.CreateAsync(newUser);

                if (!result.Succeeded)
                {
                    throw new ExternalLoginProviderException("Google", "Failed to create user account.");
                }
                user = newUser;

            }
            var info = new UserLoginInfo("Google",
                    claimsPrincipal.FindFirstValue(ClaimTypes.Email) ?? string.Empty, "Google");

            var loginResult = await _userManager.AddLoginAsync(user, info);

            if (!loginResult.Succeeded)
            {
                throw new ExternalLoginProviderException("Google",
                $"Failed to link Google account: {string.Join(", ", loginResult.Errors.Select(e => e.Description))}");
            }
            var (jwtToken, accessExpireAtUtc) = _tokenProcessor.GenerateJwtToken(user);
            var newRefreshToken = _tokenProcessor.GenerateRefreshToken();
            var newRefreshExpireAtUtc = DateTime.UtcNow.AddDays(7);

            user.RefreshToken = newRefreshToken;
            user.RefreshTokenExpireAtUtc = newRefreshExpireAtUtc;
            await _userManager.UpdateAsync(user);

            _tokenProcessor.WriteAuthTokenAsHttpOnlyCookie("ACCESS_TOKEN", jwtToken, accessExpireAtUtc);
            _tokenProcessor.WriteAuthTokenAsHttpOnlyCookie("REFRESH_TOKEN", newRefreshToken, newRefreshExpireAtUtc);

        }
    }


}
