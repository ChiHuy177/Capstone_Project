using Microsoft.AspNetCore.Identity;

namespace CapstoneProject.Server.Authentication.Entities
{
    public class User : IdentityUser<Guid>
    {
        public required string FullName { get; set; }

        public string? RefreshToken { get; set; }
        public DateTime? RefreshTokenExpireAtUtc { get; set; }
        public static User Create(string email, string fullName)
        {
            return new User
            {
                Email = email,
                UserName = email,
                FullName = fullName
            };
        }

        public override string ToString()
        {
            return FullName;
        }
    }
}
