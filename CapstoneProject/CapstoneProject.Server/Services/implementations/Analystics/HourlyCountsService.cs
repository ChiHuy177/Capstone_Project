using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using CapstoneProject.Server.Models.Analytics;
using CapstoneProject.Server.Repository.interfaces.Analystics;
using CapstoneProject.Server.Services.interfaces;

namespace CapstoneProject.Server.Services.implementations.Analystics
{
    public class HourlyCountsService : IHourlyCountService
    {
        private readonly IHourlyCountsRepository _hourlyCountsRepository;

        public HourlyCountsService(IHourlyCountsRepository hourlyCountsRepository)
        {
            _hourlyCountsRepository = hourlyCountsRepository;
        }

        public async Task<List<HourlyCount>> GetAllAsync()
        {
            var result = await _hourlyCountsRepository.GetAllAsync();
            return result.ToList();
        }
    }
}