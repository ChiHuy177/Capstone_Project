using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using CapstoneProject.Server.Authentication.Entities;

namespace CapstoneProject.Server.Repository.interfaces
{
    public interface IAccountRepository
    {
        Task<User?> GetUserByRefreshTokenAsync(string refreshToken);
    }
}