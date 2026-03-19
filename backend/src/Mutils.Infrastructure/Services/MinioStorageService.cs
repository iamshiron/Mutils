using Minio;
using Minio.DataModel.Args;
using Microsoft.Extensions.Logging;
using Mutils.Core.Entities;
using Mutils.Core.Services;

namespace Mutils.Infrastructure.Services;

public class MinioStorageService : IStorageService {
    private readonly IMinioClient _minioClient;
    private readonly ILogger<MinioStorageService> _logger;
    private readonly HashSet<string> _verifiedBuckets = [];

    public MinioStorageService(IMinioClient minioClient, ILogger<MinioStorageService> logger) {
        _minioClient = minioClient;
        _logger = logger;
    }

    public async Task<StoredImage?> StoreImageAsync(string url, string bucketName, CancellationToken cancellationToken = default) {
        try {
            await EnsureBucketExistsAsync(bucketName, cancellationToken);

            using var httpClient = new HttpClient();
            httpClient.Timeout = TimeSpan.FromSeconds(30);

            var response = await httpClient.GetAsync(url, HttpCompletionOption.ResponseHeadersRead, cancellationToken);
            if (!response.IsSuccessStatusCode) {
                _logger.LogWarning("Failed to fetch image from {Url}: {StatusCode}", url, response.StatusCode);
                return null;
            }

            var contentType = response.Content.Headers.ContentType?.MediaType ?? "image/png";
            var contentLength = response.Content.Headers.ContentLength ?? 0;
            var data = await response.Content.ReadAsByteArrayAsync(cancellationToken);

            var objectKey = GenerateObjectKey(url, contentType);

            var putArgs = new PutObjectArgs()
                .WithBucket(bucketName)
                .WithObject(objectKey)
                .WithStreamData(new MemoryStream(data))
                .WithObjectSize(data.Length)
                .WithContentType(contentType);

            await _minioClient.PutObjectAsync(putArgs, cancellationToken);

            _logger.LogInformation("Stored image {ObjectKey} in bucket {BucketName}", objectKey, bucketName);

            return new StoredImage {
                ObjectKey = objectKey,
                BucketName = bucketName,
                ContentType = contentType,
                ContentLength = contentLength,
                OriginalUrl = url,
                Source = "mudae"
            };
        } catch (Exception ex) {
            _logger.LogError(ex, "Failed to store image from {Url}", url);
            return null;
        }
    }

    private async Task EnsureBucketExistsAsync(string bucketName, CancellationToken cancellationToken) {
        if (_verifiedBuckets.Contains(bucketName))
            return;

        var bucketExistsArgs = new BucketExistsArgs().WithBucket(bucketName);
        var exists = await _minioClient.BucketExistsAsync(bucketExistsArgs, cancellationToken);

        if (!exists) {
            _logger.LogInformation("Creating MinIO bucket {BucketName}", bucketName);
            var makeBucketArgs = new MakeBucketArgs().WithBucket(bucketName);
            await _minioClient.MakeBucketAsync(makeBucketArgs, cancellationToken);
        }

        _verifiedBuckets.Add(bucketName);
    }

    public async Task<Stream?> GetImageAsync(string bucketName, string objectKey, CancellationToken cancellationToken = default) {
        try {
            var memoryStream = new MemoryStream();
            var getArgs = new GetObjectArgs()
                .WithBucket(bucketName)
                .WithObject(objectKey)
                .WithCallbackStream((stream, ct) => stream.CopyToAsync(memoryStream, ct));

            await _minioClient.GetObjectAsync(getArgs, cancellationToken);
            memoryStream.Position = 0;
            return memoryStream;
        } catch (Exception ex) {
            _logger.LogError(ex, "Failed to get image {ObjectKey} from bucket {BucketName}", objectKey, bucketName);
            return null;
        }
    }

    public async Task<string?> GetPresignedUrlAsync(string bucketName, string objectKey, int expiryMinutes = 60) {
        try {
            var presignArgs = new PresignedGetObjectArgs()
                .WithBucket(bucketName)
                .WithObject(objectKey)
                .WithExpiry(expiryMinutes * 60);

            return await _minioClient.PresignedGetObjectAsync(presignArgs);
        } catch (Exception ex) {
            _logger.LogError(ex, "Failed to generate presigned URL for {ObjectKey}", objectKey);
            return null;
        }
    }

    public async Task<bool> ExistsAsync(string bucketName, string objectKey, CancellationToken cancellationToken = default) {
        try {
            var statArgs = new StatObjectArgs()
                .WithBucket(bucketName)
                .WithObject(objectKey);

            await _minioClient.StatObjectAsync(statArgs, cancellationToken);
            return true;
        } catch {
            return false;
        }
    }

    public async Task DeleteImageAsync(string bucketName, string objectKey, CancellationToken cancellationToken = default) {
        try {
            var removeArgs = new RemoveObjectArgs()
                .WithBucket(bucketName)
                .WithObject(objectKey);

            await _minioClient.RemoveObjectAsync(removeArgs, cancellationToken);
            _logger.LogInformation("Deleted image {ObjectKey} from bucket {BucketName}", objectKey, bucketName);
        } catch (Exception ex) {
            _logger.LogError(ex, "Failed to delete image {ObjectKey} from bucket {BucketName}", objectKey, bucketName);
        }
    }

    private static string GenerateObjectKey(string originalUrl, string contentType) {
        var extension = contentType switch {
            "image/png" => "png",
            "image/jpeg" or "image/jpg" => "jpg",
            "image/gif" => "gif",
            "image/webp" => "webp",
            _ => "bin"
        };

        var hash = Convert.ToHexString(System.Security.Cryptography.MD5.HashData(System.Text.Encoding.UTF8.GetBytes(originalUrl))).ToLowerInvariant();
        var date = DateTime.UtcNow.ToString("yyyy/MM/dd");
        return $"characters/{date}/{hash}.{extension}";
    }
}
