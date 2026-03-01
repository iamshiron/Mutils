namespace Mutils.Core.DTOs;

public record CalculatorConfigDto(
    Guid Id,
    string Name,
    int TotalPool,
    int DisabledLimit,
    int AntiDisabled,
    int SilverBadge,
    int RubyBadge,
    int BwLevel,
    int Perk2,
    int Perk3,
    int Perk4,
    int OwnedTotal,
    int OwnedDisabled,
    DateTime CreatedAt,
    DateTime UpdatedAt
);

public record CreateCalculatorConfigRequest(
    string Name,
    int TotalPool,
    int DisabledLimit,
    int AntiDisabled,
    int SilverBadge,
    int RubyBadge,
    int BwLevel,
    int Perk2,
    int Perk3,
    int Perk4,
    int OwnedTotal,
    int OwnedDisabled
);

public record UpdateCalculatorConfigRequest(
    string? Name,
    int? TotalPool,
    int? DisabledLimit,
    int? AntiDisabled,
    int? SilverBadge,
    int? RubyBadge,
    int? BwLevel,
    int? Perk2,
    int? Perk3,
    int? Perk4,
    int? OwnedTotal,
    int? OwnedDisabled
);
