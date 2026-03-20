namespace Mutils.Core.Entities;

public sealed class Character : BaseEntity {
    public required string Name { get; set; }
    public int? Rank { get; set; }
    public int? Claims { get; set; }
    public int? Images { get; set; }
    public int? Gifs { get; set; }
    public int? SeriesCount { get; set; }
    public string? KeyType { get; set; }
    public int? KeyCount { get; set; }
    public int? Kakera { get; set; }
    public int? Sp { get; set; }
    public string? OriginalImageUrl { get; set; }
    public Guid? StoredImageId { get; set; }
    public StoredImage? StoredImage { get; set; }
    public string Source { get; set; } = "mudae";
    public bool Disabled { get; set; } = false;

    public Guid? SeriesId { get; set; } = null;

    public ICollection<CollectionEntry> CollectionEntries { get; set; } = [];
    public ICollection<BundleCharacterEntry> BundleEntries { get; set; } = [];
    public ICollection<WishlistEntry> WishlistEntries { get; set; } = [];
    public Series? Series { get; set; }
}
