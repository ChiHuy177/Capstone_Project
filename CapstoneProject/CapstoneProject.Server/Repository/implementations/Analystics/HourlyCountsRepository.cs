using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using CapstoneProject.Server.Data;
using CapstoneProject.Server.Models.Analytics;
using CapstoneProject.Server.Repository.interfaces.Analystics;

namespace CapstoneProject.Server.Repository.implementations.Analystics
{
    public class HourlyCountsRepository : GenericRepository<HourlyCount>, IHourlyCountsRepository
    {
        public HourlyCountsRepository(ApplicationDbContext context) : base(context)
        {
        }
    }
}