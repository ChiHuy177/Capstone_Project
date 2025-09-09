using CapstoneProject.Server.Authentication.Entities;
using CapstoneProject.Server.Authentication.Exception;
using CapstoneProject.Server.Authentication.Requests;
using CapstoneProject.Server.Repository.interfaces;
using CapstoneProject.Server.Services.interfaces;
using Microsoft.AspNetCore.Identity;

namespace CapstoneProject.Server.Services.implementations
{
    public class AccountService: IAccountService
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

            var newUser = User.Create(registerRequest.Email, registerRequest.FirstName, registerRequest.LastName);

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

            if(user.RefreshTokenExpireAtUtc < DateTime.UtcNow)
            {
                throw new RefreshTokenInvalidException("Refresh token has expired");
            }
        }

    }


}
