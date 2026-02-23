namespace Mutils.Core.Entities;

public sealed class CollectionEntry : BaseEntity {
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
    public Guid CharacterId { get; set; }
    public Character Character { get; set; } = null!;
    public DateTime? AcquiredAt { get; set; }
    public string? Notes { get; set; }
}
