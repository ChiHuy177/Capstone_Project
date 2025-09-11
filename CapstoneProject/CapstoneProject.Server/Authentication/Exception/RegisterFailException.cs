namespace CapstoneProject.Server.Authentication.Exception
{
    public class RegisterFailException(IEnumerable<string> errorDes) : 
        System.Exception($"Register fail with code: {String.Join(Environment.NewLine, errorDes)}");
}
