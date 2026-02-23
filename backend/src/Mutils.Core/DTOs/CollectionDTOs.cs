namespace Mutils.Core.DTOs;

public sealed record CollectionEntryDto(
    Guid Id,
    CharacterDto Character,
    DateTime? AcquiredAt,
    string? Notes
);

public sealed record CharacterDto(
    Guid Id,
    string Name,
    int? Rank,
    int? Claims,
    int? Images,
    int? Gifs,
    int? SeriesCount,
    string? KeyType,
    int? KeyCount,
    int? Kakera,
    int? Sp,
    string? ImageUrl,
    Guid? StoredImageId
);

public sealed record PaginatedResponse<T>(
    IReadOnlyList<T> Items,
    int Total,
    int Page,
    int PageSize,
    int TotalPages
);

public sealed record ImportRequest(string Data);

public sealed record ImportResponse(
    int Imported,
    int Skipped,
    int Updated,
    IReadOnlyList<string> Errors,
    int ImagesQueued = 0
);

public sealed record CollectionStatsDto(
    int TotalCharacters,
    int TotalKakera,
    Dictionary<string, int> KeyDistribution
);
