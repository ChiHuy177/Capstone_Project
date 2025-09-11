namespace CapstoneProject.Server.Authentication.Requests
{
    public record RegisterRequest
    {
        public required string FullName { get; set; }
        public required string Email { get; set; }
        public required string Password { get; set; }

    }
}
