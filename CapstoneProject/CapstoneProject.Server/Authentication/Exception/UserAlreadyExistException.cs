namespace CapstoneProject.Server.Authentication.Exception
{
    public class UserAlreadyExistException(string email) : System.Exception($"User with email: {email} already exist");
}
