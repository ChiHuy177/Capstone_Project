using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace CapstoneProject.Server.Models
{
    public class CreateRoleRequest
    {
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
    }

    public class UpdateRoleRequest
    {
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
    }

    public class AssignRoleRequest
    {
        public Guid UserId { get; set; }
        public string RoleName { get; set; } = string.Empty;
    }

    public class RemoveRoleRequest
    {
        public Guid UserId { get; set; }
        public string RoleName { get; set; } = string.Empty;
    }
}