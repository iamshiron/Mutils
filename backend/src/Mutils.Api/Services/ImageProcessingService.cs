using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Mutils.Core.Entities;
using Mutils.Core.Services;
using Mutils.Infrastructure.Data;

namespace Mutils.Api.Services;

public class ImageProcessingService : BackgroundService {
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<ImageProcessingService> _logger;
    private readonly TimeSpan _pollingInterval = TimeSpan.FromSeconds(5);
    private readonly int _maxRetries = 3;

    public ImageProcessingService(IServiceProvider serviceProvider, ILogger<ImageProcessingService> logger) {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken) {
        _logger.LogInformation("Image processing service started");

        while (!stoppingToken.IsCancellationRequested) {
            try {
                await ProcessPendingJobsAsync(stoppingToken);
            } catch (Exception ex) {
                _logger.LogError(ex, "Error in image processing service");
            }

            await Task.Delay(_pollingInterval, stoppingToken);
        }

        _logger.LogInformation("Image processing service stopped");
    }

    private async Task ProcessPendingJobsAsync(CancellationToken cancellationToken) {
        using var scope = _serviceProvider.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<MutilsDbContext>();
        var storageService = scope.ServiceProvider.GetRequiredService<IStorageService>();
        var configuration = scope.ServiceProvider.GetRequiredService<IConfiguration>();

        var bucketName = configuration["MINIO_BUCKET_ASSETS"] ?? "mutils-assets";

        var pendingJobs = await dbContext.ImageJobs
            .Include(j => j.Character)
            .Where(j => j.Status == ImageJobStatus.Pending && j.RetryCount < _maxRetries)
            .OrderBy(j => j.CreatedAt)
            .Take(5)
            .ToListAsync(cancellationToken);

        if (pendingJobs.Count == 0)
            return;

        _logger.LogInformation("Processing {Count} image jobs", pendingJobs.Count);

        foreach (var job in pendingJobs) {
            await ProcessJobAsync(dbContext, storageService, job, bucketName, cancellationToken);
        }
    }

    private async Task ProcessJobAsync(
        MutilsDbContext dbContext,
        IStorageService storageService,
        ImageJob job,
        string bucketName,
        CancellationToken cancellationToken) {
        try {
            job.Status = ImageJobStatus.Processing;
            await dbContext.SaveChangesAsync(cancellationToken);

            var existingImage = await dbContext.StoredImages
                .FirstOrDefaultAsync(s => s.OriginalUrl == job.OriginalUrl, cancellationToken);

            if (existingImage is not null) {
                job.Character.StoredImageId = existingImage.Id;
                job.Status = ImageJobStatus.Completed;
                job.ProcessedAt = DateTime.UtcNow;
                await dbContext.SaveChangesAsync(cancellationToken);
                _logger.LogInformation("Reused existing image for character {CharacterId}", job.CharacterId);
                return;
            }

            var storedImage = await storageService.StoreImageAsync(job.OriginalUrl, bucketName, cancellationToken);

            if (storedImage is not null) {
                dbContext.StoredImages.Add(storedImage);
                await dbContext.SaveChangesAsync(cancellationToken);

                job.Character.StoredImageId = storedImage.Id;
                job.Status = ImageJobStatus.Completed;
                job.ProcessedAt = DateTime.UtcNow;
                await dbContext.SaveChangesAsync(cancellationToken);
                _logger.LogInformation("Stored image for character {CharacterId}: {ObjectKey}", job.CharacterId, storedImage.ObjectKey);
            } else {
                throw new Exception("Failed to store image");
            }
        } catch (Exception ex) {
            job.RetryCount++;
            job.ErrorMessage = ex.Message?.Length > 500 ? ex.Message[..500] : ex.Message;
            job.Status = job.RetryCount >= _maxRetries ? ImageJobStatus.Failed : ImageJobStatus.Pending;
            await dbContext.SaveChangesAsync(cancellationToken);
            _logger.LogWarning(ex, "Failed to process image job {JobId} (retry {RetryCount}/{MaxRetries})", job.Id, job.RetryCount, _maxRetries);
        }
    }
}
