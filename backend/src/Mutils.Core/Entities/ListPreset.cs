namespace Mutils.Core.Entities;

public sealed class ListPreset : BaseEntity {
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
    public required string Name { get; set; }
    public required string Type { get; set; }
    public required string Content { get; set; }
}
