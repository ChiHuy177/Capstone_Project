using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace CapstoneProject.Server.Models.Analytics
{
    public class HourlyCount
    {
        public long Id { get; set; }
        public int Hour { get; set; }
        public int Count { get; set; }

    }
}