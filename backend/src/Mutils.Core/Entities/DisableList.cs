namespace Mutils.Core.Entities;

public sealed class DisableList : BaseEntity {
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
    public required string Name { get; set; }
    public required string Content { get; set; }
    public bool IsActive { get; set; }
}
