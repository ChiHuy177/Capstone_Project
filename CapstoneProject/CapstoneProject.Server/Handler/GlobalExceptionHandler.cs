using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using CapstoneProject.Server.Authentication.Exception;
using Microsoft.AspNetCore.Diagnostics;

namespace CapstoneProject.Server.Handler
{
    public class GlobalExceptionHandler : IExceptionHandler
    {
        private readonly ILogger<GlobalExceptionHandler> _logger;

        public GlobalExceptionHandler(ILogger<GlobalExceptionHandler> logger)
        {
            _logger = logger;
        }

        public async ValueTask<bool> TryHandleAsync(HttpContext httpContext, Exception exception, CancellationToken cancellationToken)
        {
            var (statusCode, message) = GetExceptionDetails(exception);
            _logger.LogError(exception, $"An error occurred: {exception.Message}");
            httpContext.Response.StatusCode = (int)statusCode;

            await httpContext.Response.WriteAsJsonAsync(message, cancellationToken);

            return true;
        }

        private (HttpStatusCode statusCode, string message) GetExceptionDetails(Exception exception)
        {
            return exception switch
            {
                LoginFailException => (HttpStatusCode.Unauthorized, exception.Message),
                UserAlreadyExistException => (HttpStatusCode.Conflict, exception.Message),
                RegisterFailException => (HttpStatusCode.BadRequest, exception.Message),
                RefreshTokenInvalidException => (HttpStatusCode.Unauthorized, exception.Message),
                _ => (HttpStatusCode.InternalServerError, $"An unexpected error occurred: {exception.Message}"),
            };
        }
    }
}