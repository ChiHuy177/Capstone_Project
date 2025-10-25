
using CapstoneProject.Server.Authentication.Entities;
using CapstoneProject.Server.Models.Identity;

public interface IAuthTokenProcessor
{
    (string jwtToken, DateTime expireAtUtc) GenerateJwtToken(User user, IEnumerable<string> roles);
    string GenerateRefreshToken();
    void WriteAuthTokenAsHttpOnlyCookie(string cookieName, string token, DateTime expiration);
    void ClearAuthCookie(string cookieName);

}