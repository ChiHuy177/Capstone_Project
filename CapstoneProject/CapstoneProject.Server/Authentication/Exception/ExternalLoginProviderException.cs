using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace CapstoneProject.Server.Authentication.Exception
{
    public class ExternalLoginProviderException(string provider, string message):
    System.Exception($"Extenal login provider: {provider} error occured: {message}")
    {
        
    }
}