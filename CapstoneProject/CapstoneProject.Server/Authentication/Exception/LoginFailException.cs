using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace CapstoneProject.Server.Authentication.Exception
{
    public class LoginFailException(string email) : System.Exception($"Login failed for email: {email}");

}