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

public sealed record WishlistEntryDto(
    Guid Id,
    Guid CharacterId,
    string CharacterName,
    int? Rank,
    int? Kakera,
    int? KeyCount,
    string? KeyType,
    string? SeriesName,
    string? ImageUrl,
    Guid? StoredImageId,
    bool IsStarwish,
    int Priority,
    string? Notes,
    DateTime CreatedAt,
    DateTime UpdatedAt
);

public sealed record CreateWishlistEntryRequest(
    Guid CharacterId,
    bool IsStarwish = false,
    int Priority = 0,
    string? Notes = null
);

public sealed record UpdateWishlistEntryRequest(
    bool? IsStarwish,
    int? Priority,
    string? Notes
);

public sealed record WishlistStatsDto(
    int TotalCount,
    int StarwishCount,
    int RegularCount
);
