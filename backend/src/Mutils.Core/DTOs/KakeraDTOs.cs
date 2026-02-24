using Mutils.Core.Entities;

namespace Mutils.Core.DTOs;

public record KakeraClaimDto(
    Guid Id,
    Guid UserId,
    Guid? CharacterId,
    string? CharacterName,
    KakeraType Type,
    int Value,
    DateTime ClaimedAt
);

public record CreateKakeraClaimRequest(
    Guid? CharacterId,
    string? CharacterName,
    KakeraType Type,
    int Value,
    DateTime? ClaimedAt
);
