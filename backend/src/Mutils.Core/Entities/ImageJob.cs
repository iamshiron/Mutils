namespace Mutils.Core.Entities;

public sealed class ImageJob : BaseEntity {
    public Guid CharacterId { get; set; }
    public Character Character { get; set; } = null!;
    public required string OriginalUrl { get; set; }
    public ImageJobStatus Status { get; set; } = ImageJobStatus.Pending;
    public int RetryCount { get; set; }
    public string? ErrorMessage { get; set; }
    public DateTime? ProcessedAt { get; set; }
}

public enum ImageJobStatus {
    Pending,
    Processing,
    Completed,
    Failed
}
