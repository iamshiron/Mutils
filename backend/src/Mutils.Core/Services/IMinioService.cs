namespace Mutils.Core.Services;

public interface IMinioService {
    Task UploadUserFileAsync(Guid userId, string fileName, Stream content, string contentType, CancellationToken cancellationToken = default);
    Task<Stream?> DownloadUserFileAsync(Guid userId, string fileName, CancellationToken cancellationToken = default);
    Task DeleteUserFileAsync(Guid userId, string fileName, CancellationToken cancellationToken = default);
    Task<string?> GetAssetUrlAsync(string assetName);
}
