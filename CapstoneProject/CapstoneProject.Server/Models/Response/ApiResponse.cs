using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace CapstoneProject.Server.Models.Response
{
    public class ApiResponse<T>
    {
        public Metadata Metadata { get; set; }
        public T? Data { get; set; }
        public static ApiResponse<T> Success(T data, string message = "Success", int? code = null)
    {
        return new ApiResponse<T>
        {
            Metadata = new Metadata
            {
                Message = message,
                Code = code ?? 200,
                Timestamp = DateTime.UtcNow
            },
            Data = data
        };
    }

    }
}