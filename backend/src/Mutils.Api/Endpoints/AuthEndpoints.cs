using System.Security.Claims;
using Microsoft.Extensions.Logging;
using Mutils.Api.Services;
using Mutils.Core.DTOs;

namespace Mutils.Api.Endpoints;

public static class AuthEndpoints {
    private static readonly ILogger Logger = LoggerFactory.Create(builder => builder.AddConsole()).CreateLogger("AuthEndpoints");

    public static void MapAuthEndpoints(this IEndpointRouteBuilder app) {
        var group = app.MapGroup("/api/auth");

        group.MapGet("/discord", (
            IAuthService authService,
            IConfiguration config) => {
                var redirectUri = config["DISCORD_REDIRECT_URI"]
                    ?? "http://localhost:5173/auth/callback";
                var url = authService.GetDiscordOAuthUrl(redirectUri);
                return Results.Redirect(url);
            });

        group.MapGet("/callback", async (
            string? code,
            string? redirect_uri,
            IAuthService authService) => {
                Logger.LogInformation("Auth callback received with code length: {CodeLength}", code?.Length ?? 0);

                if (string.IsNullOrEmpty(code)) {
                    return Results.BadRequest(new { error = "No code provided" });
                }

                if (string.IsNullOrEmpty(redirect_uri)) {
                    return Results.BadRequest(new { error = "No redirect_uri provided" });
                }

                var (user, error) = await authService.ExchangeCodeForUserAsync(code, redirect_uri);
                if (error is not null || user is null) {
                    Logger.LogWarning("Auth failed: {Error}", error ?? "Unknown error");
                    return Results.BadRequest(new { error = error ?? "Unknown error" });
                }

                Logger.LogInformation("Auth successful for user: {Username} ({DiscordId})", user.Username, user.DiscordId);

                var accessToken = authService.GenerateAccessToken(user);
                var refreshToken = authService.GenerateRefreshToken();

                return Results.Ok(new AuthResponse(
                    accessToken,
                    refreshToken,
                    86400,
                    new UserDto(user.Id, user.DiscordId, user.Username, user.AvatarUrl)
                ));
            });

        group.MapPost("/refresh", (
            RefreshTokenRequest request,
            IAuthService authService) => {
                return Results.Ok(new { message = "Refresh token endpoint - implement token storage" });
            });

        group.MapPost("/logout", () => {
            return Results.NoContent();
        }).RequireAuthorization();
    }
}
