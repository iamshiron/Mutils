namespace Mutils.Core.Entities;

public sealed class User : BaseEntity {
    public required string DiscordId { get; set; }
    public required string Username { get; set; }
    public string? AvatarUrl { get; set; }

    public ICollection<CollectionEntry> Collection { get; set; } = [];
    public ICollection<EnableList> EnableLists { get; set; } = [];
    public ICollection<DisableList> DisableLists { get; set; } = [];
    public ICollection<ListPreset> ListPresets { get; set; } = [];
    public ICollection<WishlistEntry> WishlistEntries { get; set; } = [];
}
