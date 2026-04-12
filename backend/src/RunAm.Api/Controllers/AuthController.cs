using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using RunAm.Application.Auth.Commands;
using RunAm.Shared.Constants;
using RunAm.Shared.DTOs;
using RunAm.Shared.DTOs.Auth;

namespace RunAm.Api.Controllers;

[Route("api/v1/auth")]
[EnableRateLimiting("auth")]
public class AuthController : BaseApiController
{
    private readonly IMediator _mediator;
    private readonly IWebHostEnvironment _env;

    public AuthController(IMediator mediator, IWebHostEnvironment env)
    {
        _mediator = mediator;
        _env = env;
    }

    /// <summary>Register a new user (sends OTP via SMS)</summary>
    [HttpPost("register")]
    [ProducesResponseType(typeof(ApiResponse<RegisterResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        var result = await _mediator.Send(new RegisterCommand(request));
        return Ok(ApiResponse<RegisterResponse>.Ok(result));
    }

    /// <summary>Verify phone OTP and complete registration</summary>
    [HttpPost("verify-otp")]
    [ProducesResponseType(typeof(ApiResponse<AuthResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> VerifyOtp([FromBody] VerifyOtpRequest request)
    {
        var result = await _mediator.Send(new VerifyOtpCommand(request));
        SetRefreshTokenCookie(result.RefreshToken);
        return Ok(ApiResponse<AuthResponse>.Ok(result));
    }

    /// <summary>Resend verification OTP</summary>
    [HttpPost("resend-otp")]
    [ProducesResponseType(typeof(ApiResponse<RegisterResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ResendOtp([FromBody] ResendOtpRequest request)
    {
        var result = await _mediator.Send(new ResendOtpCommand(request));
        return Ok(ApiResponse<RegisterResponse>.Ok(result));
    }

    /// <summary>Login with email and password</summary>
    [HttpPost("login")]
    [ProducesResponseType(typeof(ApiResponse<AuthResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var result = await _mediator.Send(new LoginCommand(request));
        SetRefreshTokenCookie(result.RefreshToken);
        return Ok(ApiResponse<AuthResponse>.Ok(result));
    }

    /// <summary>Refresh access token</summary>
    [HttpPost("refresh-token")]
    [ProducesResponseType(typeof(ApiResponse<AuthResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> RefreshToken([FromBody] RefreshTokenRequest request)
    {
        // Prefer cookie-based refresh token; fall back to body for mobile clients
        var refreshToken = Request.Cookies["refresh_token"] ?? request.RefreshToken;
        var effectiveRequest = new RefreshTokenRequest(request.AccessToken, refreshToken);
        var result = await _mediator.Send(new RefreshTokenCommand(effectiveRequest));
        SetRefreshTokenCookie(result.RefreshToken);
        return Ok(ApiResponse<AuthResponse>.Ok(result));
    }

    /// <summary>Logout — clears the refresh token cookie</summary>
    [HttpPost("logout")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    public IActionResult Logout()
    {
        Response.Cookies.Delete("refresh_token", BuildCookieOptions(TimeSpan.Zero));
        return Ok(ApiResponse.Ok());
    }

    /// <summary>Change password for authenticated user</summary>
    [Authorize]
    [HttpPost("change-password")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
    {
        await _mediator.Send(new ChangePasswordCommand(GetUserId(), request));
        return Ok(ApiResponse<string>.Ok("Password changed successfully."));
    }

    // ── Helpers ──────────────────────────────────

    private void SetRefreshTokenCookie(string refreshToken)
    {
        var options = BuildCookieOptions(TimeSpan.FromDays(AppConstants.Auth.RefreshTokenExpirationDays));
        Response.Cookies.Append("refresh_token", refreshToken, options);
    }

    private CookieOptions BuildCookieOptions(TimeSpan maxAge)
    {
        return new CookieOptions
        {
            HttpOnly = true,
            Secure = !_env.IsDevelopment(),
            SameSite = _env.IsDevelopment() ? SameSiteMode.Lax : SameSiteMode.Strict,
            Path = "/api/v1/auth",
            MaxAge = maxAge
        };
    }
}
