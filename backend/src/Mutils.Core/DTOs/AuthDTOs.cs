namespace Mutils.Core.DTOs;

public sealed record AuthResponse(
    string AccessToken,
    string RefreshToken,
    int ExpiresIn,
    UserDto User
);

public sealed record UserDto(
    Guid Id,
    string DiscordId,
    string Username,
    string? AvatarUrl
);

public sealed record RefreshTokenRequest(string RefreshToken);

public sealed record DiscordOAuthCallback(string Code, string? State);
