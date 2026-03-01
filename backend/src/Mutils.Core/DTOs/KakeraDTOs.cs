using Mutils.Core.Entities;

namespace Mutils.Core.DTOs;

public record KakeraClaimDto(
    Guid Id,
    Guid UserId,
    Guid? CharacterId,
    string? CharacterName,
    KakeraType Type,
    int Value,
    bool IsClaimed,
    DateTime ClaimedAt
);

public record CreateKakeraClaimRequest(
    Guid? CharacterId,
    string? CharacterName,
    KakeraType Type,
    int Value,
    bool IsClaimed,
    DateTime? ClaimedAt
);

public record UpdateKakeraClaimRequest(
    string? CharacterName,
    KakeraType Type,
    int Value,
    bool IsClaimed,
    DateTime? ClaimedAt
);

public record ImportKakeraClaimItem(
    Guid Id,
    string? CharacterName,
    KakeraType Type,
    int Value,
    bool IsClaimed,
    DateTime ClaimedAt
);

public record BulkKakeraImportRequest(
    string Data,
    string? CharacterName
);

public record ParsedKakeraClaim(
    KakeraType Type,
    int Value,
    DateTime? ClaimedAt
);

public record BulkKakeraImportResponse(
    int Imported,
    int Skipped,
    List<string> Errors
);
