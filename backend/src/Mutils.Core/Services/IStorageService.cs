using Mutils.Core.Entities;

namespace Mutils.Core.Services;

public interface IStorageService {
    Task<StoredImage?> StoreImageAsync(string url, string bucketName, CancellationToken cancellationToken = default);
    Task<Stream?> GetImageAsync(string bucketName, string objectKey, CancellationToken cancellationToken = default);
    Task<string?> GetPresignedUrlAsync(string bucketName, string objectKey, int expiryMinutes = 60);
    Task<bool> ExistsAsync(string bucketName, string objectKey, CancellationToken cancellationToken = default);
    Task DeleteImageAsync(string bucketName, string objectKey, CancellationToken cancellationToken = default);
}
