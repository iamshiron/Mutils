namespace Mutils.Core.Entities;

public class Bundle : BaseEntity {
    public required string Name { get; set; }

    public ICollection<BundleSeriesEntry> SeriesEntries { get; set; } = [];
    public ICollection<BundleCharacterEntry> CharacterEntries { get; set; } = [];
}

public class BundleSeriesEntry {
    public required Guid BundleId { get; set; }
    public required Guid SeriesId { get; set; }

    public Bundle? Bundle { get; set; }
    public Series? Series { get; set; }
}

public class BundleCharacterEntry {
    public required Guid BundleId { get; set; }
    public required Guid CharacterId { get; set; }

    public Bundle? Bundle { get; set; }
    public Character? Character { get; set; }
}
