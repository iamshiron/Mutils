namespace Mutils.Core.Entities;

public sealed class Series : BaseEntity {
    public required string Name { get; set; }

    public ICollection<Character> Characters { get; set; } = [];
    public ICollection<BundleSeriesEntry> BundleEntries { get; set; } = [];
}
