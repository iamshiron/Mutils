namespace Mutils.Core.Entities;

public sealed class CalculatorConfig : BaseEntity {
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
    public required string Name { get; set; }
    public int TotalPool { get; set; }
    public int DisabledLimit { get; set; }
    public int AntiDisabled { get; set; }
    public int SilverBadge { get; set; }
    public int RubyBadge { get; set; }
    public int BwLevel { get; set; }
    public int Perk2 { get; set; }
    public int Perk3 { get; set; }
    public int Perk4 { get; set; }
    public int OwnedTotal { get; set; }
    public int OwnedDisabled { get; set; }
}
