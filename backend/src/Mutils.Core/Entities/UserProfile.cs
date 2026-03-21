namespace Mutils.Core.Entities;

public sealed class UserProfile : BaseEntity {
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    // Kakera Badges (0-12)
    public int BronzeBadge { get; set; }
    public int SilverBadge { get; set; }
    public int GoldBadge { get; set; }
    public int SapphireBadge { get; set; }
    public int RubyBadge { get; set; }
    public int EmeraldBadge { get; set; }
    public int DiamondBadge { get; set; }

    // Tower Perks (0-5)
    public int TowerPerk1 { get; set; }
    public int TowerPerk2 { get; set; }
    public int TowerPerk3 { get; set; }
    public int TowerPerk4 { get; set; }
    public int TowerPerk5 { get; set; }
    public int TowerPerk6 { get; set; }
    public int TowerPerk7 { get; set; }
    public int TowerPerk8 { get; set; }
    public int TowerPerk9 { get; set; }
    public int TowerPerk10 { get; set; }
    public int TowerPerk11 { get; set; }
    public int TowerPerk12 { get; set; }

    // Roll Calculator Manual Fields
    public int TotalPool { get; set; }
    public int DisabledLimit { get; set; }
    public int AntiDisabled { get; set; }
    public int TotalRolls { get; set; }
    public int BwRollsInvested { get; set; }

    // Server Settings
    public int KakeraPerFloor { get; set; } = 5000;
    public int BronzeBadgePrice { get; set; } = 1000;
    public int SilverBadgePrice { get; set; } = 2000;
    public int GoldBadgePrice { get; set; } = 3000;
    public int SapphireBadgePrice { get; set; } = 5000;
    public int RubyBadgePrice { get; set; } = 7000;
    public int EmeraldBadgePrice { get; set; } = 9000;
    public int DiamondBadgePrice { get; set; } = 12000;
}
