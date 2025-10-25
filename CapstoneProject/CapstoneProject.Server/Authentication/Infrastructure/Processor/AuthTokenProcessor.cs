using CapstoneProject.Server.Authentication.Entities;
using CapstoneProject.Server.Authentication.Infrastructure.Options;
using CapstoneProject.Server.Models.Identity;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;


namespace CapstoneProject.Server.Authentication.Infrastructure.Processor
{
    public class AuthTokenProcessor : IAuthTokenProcessor
    {
        private readonly JwtOptions _jwtOptions;
        private readonly IHttpContextAccessor _contextAccessor;
        public AuthTokenProcessor(IOptions<JwtOptions> jwtOptions, IHttpContextAccessor httpContextAccessor)
        {
            _jwtOptions = jwtOptions.Value;
            _contextAccessor = httpContextAccessor;
        }

        public void ClearAuthCookie(string cookieName)
        {
            _contextAccessor.HttpContext.Response.Cookies.Append(cookieName,
            "", new CookieOptions
            {
                HttpOnly = true,
                Secure = true,
                IsEssential = true,
                Expires = DateTimeOffset.UnixEpoch,
                Path = "/",
                SameSite = SameSiteMode.None,
            });
        }

        public (string jwtToken, DateTime expireAtUtc) GenerateJwtToken(User user, IEnumerable<string> roles)
        {
            var signingKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(_jwtOptions.Secret));

            var credentials = new SigningCredentials(
                signingKey,
                SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
                new Claim(JwtRegisteredClaimNames.Email, user.Email.ToString()),
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Name, user.FullName),
                new Claim(ClaimTypes.Role, string.Join(",", roles))
            };

            var expires = DateTime.UtcNow.AddMinutes(_jwtOptions.ExpirationTimeInMinutes);

            var token = new JwtSecurityToken(
                issuer: _jwtOptions.Issuer,
                audience: _jwtOptions.Audience,
                claims: claims,
                expires: expires,
                signingCredentials: credentials
                );

            var jwtToken = new JwtSecurityTokenHandler().WriteToken(token);

            return (jwtToken, expires);
        }

        public string GenerateRefreshToken()
        {
            var randomNumber = new byte[64];
            using var rng = RandomNumberGenerator.Create();
            rng.GetBytes(randomNumber);
            return Convert.ToBase64String(randomNumber);
        }

        public void WriteAuthTokenAsHttpOnlyCookie(string cookieName, string token, DateTime expiration)
        {
            _contextAccessor.HttpContext.Response.Cookies.Append(cookieName,
            token, new CookieOptions
            {
                HttpOnly = true,
                Expires = expiration,
                IsEssential = true,
                Secure = true,
                Path = "/",
                SameSite = SameSiteMode.None,
            });
        }


    }
}
