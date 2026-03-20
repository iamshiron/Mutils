namespace Mutils.Core.Entities;

public sealed class WishlistEntry : BaseEntity {
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
    public Guid CharacterId { get; set; }
    public Character Character { get; set; } = null!;
    public bool IsStarwish { get; set; } = false;
    public int Priority { get; set; } = 0;
    public string? Notes { get; set; }
}
