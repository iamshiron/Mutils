namespace Mutils.Core.DTOs;

public sealed record EnableListDto(
    Guid Id,
    string Name,
    string Content,
    bool IsActive,
    DateTime CreatedAt,
    DateTime UpdatedAt
);

public sealed record DisableListDto(
    Guid Id,
    string Name,
    string Content,
    bool IsActive,
    DateTime CreatedAt,
    DateTime UpdatedAt
);

public sealed record ListPresetDto(
    Guid Id,
    string Name,
    string Type,
    string Content,
    DateTime CreatedAt,
    DateTime UpdatedAt
);

public sealed record CreateListRequest(string Name, string Content, bool IsActive = false);

public sealed record UpdateListRequest(string? Name, string? Content, bool? IsActive);

public sealed record ExportRequest(Guid ListId, string Format);

public sealed record ExportResponse(string Content, int CharacterCount);
