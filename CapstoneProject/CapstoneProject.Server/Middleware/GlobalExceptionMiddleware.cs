using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using CapstoneProject.Server.Models;
using CapstoneProject.Server.Models.Response;

namespace CapstoneProject.Server.Middleware
{
    public class GlobalExceptionMiddleware
    {
        private readonly RequestDelegate _next;

        public GlobalExceptionMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            try
            {
                await _next(context);
            }
            catch (Exception ex)
            {
                context.Response.StatusCode = 500;
                context.Response.ContentType = "application/json";

                var response = new ApiResponse<string>
                {
                    Metadata = new Metadata
                    {
                        Code = 500,
                        Message = ex.Message,
                        Timestamp = DateTime.UtcNow
                    },
                    Data = null
                };

                await context.Response.WriteAsJsonAsync(response);
            }
        }
    }
}