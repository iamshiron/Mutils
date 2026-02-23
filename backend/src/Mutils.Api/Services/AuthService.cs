using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.IdentityModel.Tokens;
using Mutils.Core.Entities;
using Mutils.Infrastructure.Data;

namespace Mutils.Api.Services;

public interface IAuthService {
    string GenerateAccessToken(User user);
    string GenerateRefreshToken();
    string GetDiscordOAuthUrl(string redirectUri);
    Task<(User? User, string? Error)> ExchangeCodeForUserAsync(string code, string redirectUri);
    ClaimsPrincipal? GetPrincipalFromToken(string token);
}

public class AuthService : IAuthService {
    private readonly IConfiguration _configuration;
    private readonly MutilsDbContext _dbContext;
    private readonly HttpClient _httpClient;
    private readonly ILogger<AuthService> _logger;

    public AuthService(IConfiguration configuration, MutilsDbContext dbContext, ILogger<AuthService> logger) {
        _configuration = configuration;
        _dbContext = dbContext;
        _httpClient = new HttpClient();
        _logger = logger;
    }

    public string GenerateAccessToken(User user) {
        var jwtSecret = _configuration["JWT_SECRET"]
            ?? throw new InvalidOperationException("JWT_SECRET not configured");
        var issuer = _configuration["JWT_ISSUER"] ?? "mutils";
        var audience = _configuration["JWT_AUDIENCE"] ?? "mutils-users";
        var expiryHours = int.Parse(_configuration["JWT_EXPIRY_HOURS"] ?? "24");

        var key = new Microsoft.IdentityModel.Tokens.SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(jwtSecret));
        var credentials = new Microsoft.IdentityModel.Tokens.SigningCredentials(
            key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, user.DiscordId),
            new Claim("discord_id", user.DiscordId),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: DateTime.UtcNow.AddHours(expiryHours),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public string GenerateRefreshToken() {
        var randomBytes = new byte[64];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(randomBytes);
        return Convert.ToBase64String(randomBytes);
    }

    public string GetDiscordOAuthUrl(string redirectUri) {
        var clientId = _configuration["DISCORD_CLIENT_ID"]
            ?? throw new InvalidOperationException("DISCORD_CLIENT_ID not configured");

        return $"https://discord.com/oauth2/authorize?client_id={clientId}" +
               $"&redirect_uri={Uri.EscapeDataString(redirectUri)}" +
               "&response_type=code&scope=identify";
    }

    public async Task<(User? User, string? Error)> ExchangeCodeForUserAsync(string code, string redirectUri) {
        var clientId = _configuration["DISCORD_CLIENT_ID"];
        var clientSecret = _configuration["DISCORD_CLIENT_SECRET"];

        if (string.IsNullOrEmpty(clientId) || string.IsNullOrEmpty(clientSecret)) {
            _logger.LogError("Discord OAuth not configured. ClientId: {HasClientId}, ClientSecret: {HasClientSecret}",
                !string.IsNullOrEmpty(clientId), !string.IsNullOrEmpty(clientSecret));
            return (null, "Discord OAuth not configured");
        }

        _logger.LogInformation("Exchanging code for token. ClientId: {ClientId}, RedirectUri: {RedirectUri}", clientId, redirectUri);

        var tokenRequest = new Dictionary<string, string> {
            ["client_id"] = clientId,
            ["client_secret"] = clientSecret,
            ["grant_type"] = "authorization_code",
            ["code"] = code,
            ["redirect_uri"] = redirectUri
        };

        var tokenResponse = await _httpClient.PostAsync(
            "https://discord.com/api/oauth2/token",
            new FormUrlEncodedContent(tokenRequest));

        if (!tokenResponse.IsSuccessStatusCode) {
            var errorContent = await tokenResponse.Content.ReadAsStringAsync();
            _logger.LogError("Failed to exchange code for token. Status: {Status}, RedirectUri: {RedirectUri}, Response: {Response}",
                (int) tokenResponse.StatusCode, redirectUri, errorContent);
            return (null, $"Failed to exchange code: {errorContent}");
        }

        var tokenContent = await tokenResponse.Content.ReadAsStringAsync();
        var tokenData = JsonSerializer.Deserialize<JsonElement>(tokenContent);
        var accessToken = tokenData.GetProperty("access_token").GetString();

        _httpClient.DefaultRequestHeaders.Clear();
        _httpClient.DefaultRequestHeaders.Add("Authorization", $"Bearer {accessToken}");

        var userResponse = await _httpClient.GetAsync("https://discord.com/api/users/@me");
        if (!userResponse.IsSuccessStatusCode)
            return (null, "Failed to fetch Discord user");

        var userContent = await userResponse.Content.ReadAsStringAsync();
        var userData = JsonSerializer.Deserialize<JsonElement>(userContent);

        var discordId = userData.GetProperty("id").GetString()!;
        var username = userData.GetProperty("username").GetString()!;
        var avatar = userData.TryGetProperty("avatar", out var avatarEl) ? avatarEl.GetString() : null;
        var avatarUrl = avatar is not null
            ? $"https://cdn.discordapp.com/avatars/{discordId}/{avatar}.png"
            : null;

        var user = await _dbContext.Users
            .FirstOrDefaultAsync(u => u.DiscordId == discordId);
        if (user is null) {
            user = new User {
                DiscordId = discordId,
                Username = username,
                AvatarUrl = avatarUrl
            };
            _dbContext.Users.Add(user);
            _logger.LogInformation("Creating new user: {Username} ({DiscordId})", username, discordId);
        } else {
            user.Username = username;
            user.AvatarUrl = avatarUrl;
            user.UpdatedAt = DateTime.UtcNow;
            _logger.LogInformation("Updating existing user: {Username} ({DiscordId})", username, discordId);
        }

        var saved = await _dbContext.SaveChangesAsync();
        _logger.LogInformation("Saved {Count} changes to database", saved);
        return (user, null);
    }

    public ClaimsPrincipal? GetPrincipalFromToken(string token) {
        var jwtSecret = _configuration["JWT_SECRET"]
            ?? throw new InvalidOperationException("JWT_SECRET not configured");

        var tokenValidationParameters = new Microsoft.IdentityModel.Tokens.TokenValidationParameters {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = _configuration["JWT_ISSUER"] ?? "mutils",
            ValidAudience = _configuration["JWT_AUDIENCE"] ?? "mutils-users",
            IssuerSigningKey = new Microsoft.IdentityModel.Tokens.SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(jwtSecret))
        };

        try {
            var tokenHandler = new JwtSecurityTokenHandler();
            var principal = tokenHandler.ValidateToken(token, tokenValidationParameters, out _);
            return principal;
        } catch {
            return null;
        }
    }
}
