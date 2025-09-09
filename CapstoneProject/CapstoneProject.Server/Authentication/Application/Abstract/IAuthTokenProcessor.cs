
using CapstoneProject.Server.Authentication.Entities;

public interface IAuthTokenProcessor
{
    (string jwtToken, DateTime expireAtUtc) GenerateJwtToken(User user);
    string GenerateRefreshToken();
    void WriteAuthTokenAsHttpOnlyCookie(string cookieName, string token, DateTime expiration);


}