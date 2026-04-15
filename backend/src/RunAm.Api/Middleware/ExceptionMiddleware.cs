using System.Net;
using System.Text.Json;
using FluentValidation;
using RunAm.Domain.Exceptions;
using RunAm.Shared.DTOs;

namespace RunAm.Api.Middleware;

public class ExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionMiddleware> _logger;

    public ExceptionMiddleware(RequestDelegate next, ILogger<ExceptionMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            var log = ex switch
            {
                ValidationException or UnauthorizedAccessException or NotFoundException or InvalidOperationException or DomainException
                    => LogLevel.Warning,
                _ => LogLevel.Error
            };

            _logger.Log(log, ex, "Request failed: {Message}", ex.Message);
            await HandleExceptionAsync(context, ex);
        }
    }

    private static async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        context.Response.ContentType = "application/json";

        var (statusCode, response) = exception switch
        {
            ValidationException validationEx => (
                HttpStatusCode.BadRequest,
                new ApiResponse
                {
                    Success = false,
                    Error = new ApiError
                    {
                        Code = "VALIDATION_ERROR",
                        Message = "One or more validation errors occurred.",
                        Details = validationEx.Errors
                            .GroupBy(e => e.PropertyName)
                            .ToDictionary(g => g.Key, g => g.Select(e => e.ErrorMessage).ToArray())
                    }
                }
            ),
            NotFoundException notFoundEx => (
                HttpStatusCode.NotFound,
                ApiResponse.Fail(notFoundEx.Message, notFoundEx.Code)
            ),
            UnauthorizedAccessException unauthorizedEx => (
                HttpStatusCode.Unauthorized,
                ApiResponse.Fail(unauthorizedEx.Message, "UNAUTHORIZED")
            ),
            InvalidOperationException invalidOpEx => (
                HttpStatusCode.BadRequest,
                ApiResponse.Fail(invalidOpEx.Message, "BAD_REQUEST")
            ),
            DomainException domainEx => (
                HttpStatusCode.BadRequest,
                ApiResponse.Fail(domainEx.Message, domainEx.Code)
            ),
            _ => (
                HttpStatusCode.InternalServerError,
                ApiResponse.Fail("An unexpected error occurred.", "INTERNAL_ERROR")
            )
        };

        context.Response.StatusCode = (int)statusCode;

        var json = JsonSerializer.Serialize(response, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        });

        await context.Response.WriteAsync(json);
    }
}
