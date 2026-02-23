namespace Mutils.Core.Entities;

public sealed class StoredImage : BaseEntity {
    public required string ObjectKey { get; set; }
    public required string BucketName { get; set; }
    public required string ContentType { get; set; }
    public long ContentLength { get; set; }
    public int? Width { get; set; }
    public int? Height { get; set; }
    public string? OriginalUrl { get; set; }
    public string? Source { get; set; }
    public string? ETag { get; set; }

    public ICollection<Character> Characters { get; set; } = [];
}
