using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using CapstoneProject.Server.Models.Analytics;

namespace CapstoneProject.Server.Services.interfaces
{
    public interface IHourlyCountService
    {
        Task<List<HourlyCount>> GetAllAsync();
    }
}