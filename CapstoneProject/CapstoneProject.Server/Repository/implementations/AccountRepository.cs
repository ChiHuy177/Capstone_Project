using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using CapstoneProject.Server.Authentication.Entities;
using CapstoneProject.Server.Data;
using CapstoneProject.Server.Repository.interfaces;
using Microsoft.EntityFrameworkCore;

namespace CapstoneProject.Server.Repository.implementations
{
    public class AccountRepository : GenericRepository<User>, IAccountRepository
    {
        public AccountRepository(ApplicationDbContext context) : base(context)
        {
        }

        public async Task<User?> GetUserByRefreshTokenAsync(string refreshToken)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.RefreshToken == refreshToken);
            return user;
        }
    }
}