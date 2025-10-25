using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace CapstoneProject.Server.Models
{
    public class Metadata
    {
        public int Code { get; set; } = 200;
        public string Message { get; set; } = "Success";
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    }
}