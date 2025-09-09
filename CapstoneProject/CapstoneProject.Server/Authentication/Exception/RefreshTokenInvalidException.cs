using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace CapstoneProject.Server.Authentication.Exception
{
    public class RefreshTokenInvalidException(string message) : System.Exception(message)
    {
        
    }
}