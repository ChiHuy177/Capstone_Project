namespace CapstoneProject.Server.Authentication.Requests
{
    public record LoginRequest
    {
        public required string Username { get; init; }
        public required string Email { get; init; }
        public required string Password { get; init; }
    }
}
