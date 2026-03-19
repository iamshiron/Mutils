using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using Mutils.Core.DTOs;
using Mutils.Core.Services;
using Mutils.Core.Helpers;
using Mutils.Infrastructure.Data;
using Mutils.Core.Entities;

namespace Mutils.Api.Endpoints;

public static class CollectionEndpoints {
    private static readonly ILogger Logger = LoggerFactory.Create(builder => builder.AddConsole()).CreateLogger("CollectionEndpoints");

    public static void MapCollectionEndpoints(this IEndpointRouteBuilder app) {
        var group = app.MapGroup("/api/collection").RequireAuthorization();

        group.MapGet("/", async (
            ClaimsPrincipal user,
            MutilsDbContext db,
            string? search,
            string? sortBy,
            string? sortOrder,
            int? minKeys,
            int? minKakera,
            bool? isDisabled,
            int page = 1,
            int pageSize = 50) => {
                var userId = GetUserId(user);
                if (userId is null) return Results.Unauthorized();

                var activeDisableList = await db.DisableLists
                    .Where(l => l.UserId == userId && l.IsActive)
                    .Select(l => l.Content)
                    .FirstOrDefaultAsync();

                var disabledNames = activeDisableList?
                    .Split('\n', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                    .ToHashSet(StringComparer.OrdinalIgnoreCase) ?? [];

                var query = db.CollectionEntries
                    .Include(e => e.Character)
                    .Where(e => e.UserId == userId);

                if (!string.IsNullOrEmpty(search)) {
                    query = query.Where(e => e.Character.Name.Contains(search));
                }

                if (minKeys.HasValue) {
                    query = query.Where(e => e.Character.KeyCount >= minKeys.Value);
                }

                if (minKakera.HasValue) {
                    query = query.Where(e => e.Character.Kakera >= minKakera.Value);
                }

                sortBy ??= "rank";
                sortOrder ??= "asc";

                query = (sortBy.ToLower(), sortOrder.ToLower()) switch {
                    ("name", "asc") => query.OrderBy(e => e.Character.Name),
                    ("name", "desc") => query.OrderByDescending(e => e.Character.Name),
                    ("rank", "asc") => query.OrderBy(e => e.Character.Rank ?? int.MaxValue),
                    ("rank", "desc") => query.OrderByDescending(e => e.Character.Rank ?? 0),
                    ("kakera", "asc") => query.OrderBy(e => e.Character.Kakera ?? 0),
                    ("kakera", "desc") => query.OrderByDescending(e => e.Character.Kakera ?? 0),
                    ("claims", "asc") => query.OrderBy(e => e.Character.Claims ?? 0),
                    ("claims", "desc") => query.OrderByDescending(e => e.Character.Claims ?? 0),
                    ("acquiredat", "asc") => query.OrderBy(e => e.AcquiredAt),
                    ("keys", "asc") => query.OrderBy(e => e.Character.KeyCount ?? 0),
                    ("keys", "desc") => query.OrderByDescending(e => e.Character.KeyCount ?? 0),
                    ("user_kakera", "asc") => query.OrderBy(e => db.KakeraClaims
                        .Where(c => c.CharacterId == e.CharacterId && c.UserId == userId)
                        .Sum(c => (int?) c.Value) ?? 0),
                    ("user_kakera", "desc") => query.OrderByDescending(e => db.KakeraClaims
                        .Where(c => c.CharacterId == e.CharacterId && c.UserId == userId)
                        .Sum(c => (int?) c.Value) ?? 0),
                    ("acquiredat", _) => query.OrderByDescending(e => e.AcquiredAt),
                    _ => query.OrderBy(e => e.Character.Rank ?? int.MaxValue)
                };

                var total = await query.CountAsync();
                var totalPages = (int) Math.Ceiling(total / (double) pageSize);

                var entries = await query
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .Select(e => new {
                        e.Id,
                        e.Character,
                        e.AcquiredAt,
                        e.Notes
                    })
                    .ToListAsync();

                var characterIds = entries.Select(i => i.Character.Id).ToList();

                var claims = await db.KakeraClaims
                    .Where(c => c.CharacterId.HasValue && characterIds.Contains(c.CharacterId.Value) && c.UserId == userId)
                    .ToListAsync();

                var statsPerCharacter = claims
                    .GroupBy(c => c.CharacterId)
                    .ToDictionary(
                        g => g.Key!.Value,
                        g => new CharacterKakeraStatsDto(
                            g.Sum(c => c.Value),
                            g.Count(),
                            g.GroupBy(c => c.Type)
                                .ToDictionary(
                                    t => t.Key.ToString().ToLower(),
                                    t => t.Sum(c => c.Value)
                                )
                        )
                    );

                var items = entries.Select(e => {
                    var isCharDisabled = disabledNames.Contains(e.Character.Name);
                    return new CollectionEntryDto(
                        e.Id,
                        new CharacterDto(
                            e.Character.Id,
                            e.Character.Name,
                            e.Character.Rank,
                            e.Character.Claims,
                            e.Character.Images,
                            e.Character.Gifs,
                            e.Character.SeriesCount,
                            e.Character.KeyType,
                            e.Character.KeyCount,
                            e.Character.Kakera,
                            e.Character.Sp,
                            e.Character.OriginalImageUrl,
                            e.Character.StoredImageId,
                            statsPerCharacter.GetValueOrDefault(e.Character.Id)
                        ),
                        e.AcquiredAt,
                        e.Notes,
                        isCharDisabled
                    );
                }).ToList();

                if (isDisabled.HasValue) {
                    items = items.Where(e => e.IsDisabled == isDisabled.Value).ToList();
                }

                return Results.Ok(new PaginatedResponse<CollectionEntryDto>(
                    items, total, page, pageSize, totalPages
                ));
            });

        group.MapGet("/stats", async (
            ClaimsPrincipal user,
            MutilsDbContext db) => {
                var userId = GetUserId(user);
                if (userId is null) return Results.Unauthorized();

                var entries = await db.CollectionEntries
                    .Include(e => e.Character)
                    .Where(e => e.UserId == userId)
                    .Select(e => e.Character)
                    .ToListAsync();

                var keyDistribution = entries
                    .Select(c => new { KeyType = KeyHelper.GetKeyTypeFromCount(c.KeyCount) })
                    .Where(c => c.KeyType is not null)
                    .GroupBy(c => c.KeyType!)
                    .ToDictionary(g => g.Key, g => g.Count());

                var activeDisableList = await db.DisableLists
                    .Where(l => l.UserId == userId && l.IsActive)
                    .Select(l => l.Content)
                    .FirstOrDefaultAsync();

                var disabledNames = activeDisableList?
                    .Split('\n', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                    .ToHashSet(StringComparer.OrdinalIgnoreCase) ?? [];

                var disabledCount = entries.Count(c => disabledNames.Contains(c.Name));

                return Results.Ok(new CollectionStatsDto(
                    entries.Count,
                    entries.Sum(c => c.Kakera ?? 0),
                    keyDistribution,
                    disabledCount
                ));
            });

        group.MapPost("/export", async (
            ClaimsPrincipal user,
            CollectionExportRequest request,
            MutilsDbContext db) => {
                var userId = GetUserId(user);
                if (userId is null) return Results.Unauthorized();

                var baseQuery = db.CollectionEntries
                    .Where(e => e.UserId == userId);

                var totalCount = await baseQuery.CountAsync();

                IQueryable<CollectionEntry> filteredQuery = db.CollectionEntries
                    .Include(e => e.Character)
                    .Where(e => e.UserId == userId);

                if (request.MinKeys.HasValue) {
                    filteredQuery = filteredQuery.Where(e => e.Character.KeyCount >= request.MinKeys);
                }

                if (request.ExcludeDisabled == true) {
                    filteredQuery = filteredQuery.Where(e => !e.Character.Disabled);
                }

                var sortBy = request.SortBy?.ToLower() ?? "kakera";
                var sortOrder = request.SortOrder?.ToLower() ?? "desc";

                var orderedQuery = (sortBy, sortOrder) switch {
                    ("name", "asc") => filteredQuery.OrderBy(e => e.Character.Name),
                    ("name", "desc") => filteredQuery.OrderByDescending(e => e.Character.Name),
                    ("kakera", "asc") => filteredQuery.OrderBy(e => e.Character.Kakera ?? 0),
                    ("kakera", "desc") => filteredQuery.OrderByDescending(e => e.Character.Kakera ?? 0),
                    ("keycount", "asc") => filteredQuery.OrderBy(e => e.Character.KeyCount ?? 0),
                    ("keycount", "desc") => filteredQuery.OrderByDescending(e => e.Character.KeyCount ?? 0),
                    ("sp", "asc") => filteredQuery.OrderBy(e => e.Character.Sp ?? 0),
                    ("sp", "desc") => filteredQuery.OrderByDescending(e => e.Character.Sp ?? 0),
                    _ => filteredQuery.OrderByDescending(e => e.Character.Kakera ?? 0)
                };

                var exportedCount = await orderedQuery.CountAsync();

                var finalQuery = orderedQuery;
                if (request.Limit.HasValue && request.Limit > 0) {
                    finalQuery = (IOrderedQueryable<CollectionEntry>)orderedQuery.Take(request.Limit.Value);
                }

                var items = await finalQuery
                    .Select(e => new CollectionExportItemDto(
                        e.Character.Name,
                        e.Character.Kakera,
                        e.Character.KeyCount,
                        e.Character.Sp,
                        e.Character.Disabled
                    ))
                    .ToListAsync();

                return Results.Ok(new CollectionExportResponse(totalCount, exportedCount, items));
            });

        group.MapPost("/import", async (
            ClaimsPrincipal user,
            ImportRequest request,
            MutilsDbContext db,
            IMudaeParser parser) => {
                var userId = GetUserId(user);
                if (userId is null) return Results.Unauthorized();

                var parsed = parser.ParseCollection(request.Data).ToList();

                var imported = 0;
                var skipped = 0;
                var updated = 0;
                var imageJobsCreated = 0;
                var disabledImported = 0;

                var characterNames = parsed.Select(p => p.Name).Distinct().ToList();
                var existingCharacters = await db.Characters
                    .Where(c => characterNames.Contains(c.Name))
                    .ToDictionaryAsync(c => c.Name);

                var existingEntries = await db.CollectionEntries
                    .Where(e => e.UserId == userId && characterNames.Contains(e.Character.Name))
                    .Select(e => e.Character.Name)
                    .ToHashSetAsync();

                var existingImageUrls = await db.StoredImages
                    .Where(s => parsed.Select(p => p.ImageUrl).Contains(s.OriginalUrl))
                    .Select(s => s.OriginalUrl)
                    .ToHashSetAsync();

                var pendingImageUrls = await db.ImageJobs
                    .Where(j => parsed.Select(p => p.ImageUrl).Contains(j.OriginalUrl) && j.Status == ImageJobStatus.Pending)
                    .Select(j => j.OriginalUrl)
                    .ToHashSetAsync();

                var newCharacters = new List<Character>();
                var newEntries = new List<CollectionEntry>();
                var newImageJobs = new List<ImageJob>();

                foreach (var parsedChar in parsed) {
                    var isExistingEntry = existingEntries.Contains(parsedChar.Name);

                    if (!existingCharacters.TryGetValue(parsedChar.Name, out var character)) {
                        character = new Character {
                            Name = parsedChar.Name,
                            Rank = parsedChar.Rank,
                            Claims = parsedChar.Claims,
                            Images = parsedChar.Images,
                            Gifs = parsedChar.Gifs,
                            SeriesCount = parsedChar.SeriesCount,
                            KeyType = parsedChar.KeyType,
                            KeyCount = parsedChar.KeyCount,
                            Kakera = parsedChar.Kakera,
                            Sp = parsedChar.Sp,
                            OriginalImageUrl = parsedChar.ImageUrl,
                            Source = "mudae"
                        };
                        newCharacters.Add(character);
                        existingCharacters[parsedChar.Name] = character;
                    } else {
                        var needsUpdate = false;
                        if (character.Rank != parsedChar.Rank) {
                            character.Rank = parsedChar.Rank;
                            needsUpdate = true;
                        }
                        if (parsedChar.Kakera is not null && character.Kakera != parsedChar.Kakera) {
                            character.Kakera = parsedChar.Kakera;
                            needsUpdate = true;
                        }
                        if (parsedChar.Sp is not null && character.Sp != parsedChar.Sp) {
                            character.Sp = parsedChar.Sp;
                            needsUpdate = true;
                        }
                        if (parsedChar.Claims is not null && character.Claims != parsedChar.Claims) {
                            character.Claims = parsedChar.Claims;
                            needsUpdate = true;
                        }
                        if (parsedChar.KeyCount.HasValue && character.KeyCount != parsedChar.KeyCount) {
                            character.KeyType = parsedChar.KeyType;
                            character.KeyCount = parsedChar.KeyCount;
                            needsUpdate = true;
                        }
                        if (!string.IsNullOrEmpty(parsedChar.ImageUrl) && character.OriginalImageUrl != parsedChar.ImageUrl) {
                            character.OriginalImageUrl = parsedChar.ImageUrl;
                            character.StoredImageId = null;
                            needsUpdate = true;
                        }
                        if (needsUpdate) {
                            updated++;
                        }
                    }

                    if (!string.IsNullOrEmpty(parsedChar.ImageUrl)
                        && character.StoredImageId is null
                        && !existingImageUrls.Contains(parsedChar.ImageUrl)
                        && !pendingImageUrls.Contains(parsedChar.ImageUrl)) {
                        newImageJobs.Add(new ImageJob {
                            Character = character,
                            OriginalUrl = parsedChar.ImageUrl
                        });
                        imageJobsCreated++;
                    }

                    if (isExistingEntry) {
                        skipped++;
                        continue;
                    }

                    newEntries.Add(new CollectionEntry {
                        UserId = userId.Value,
                        Character = character,
                        AcquiredAt = DateTime.UtcNow
                    });

                    imported++;
                }

                if (newCharacters.Count > 0)
                    db.Characters.AddRange(newCharacters);

                if (newImageJobs.Count > 0)
                    db.ImageJobs.AddRange(newImageJobs);

                if (newEntries.Count > 0)
                    db.CollectionEntries.AddRange(newEntries);

                if (!string.IsNullOrWhiteSpace(request.DisabledCharacters)) {
                    var disabledNames = parser.ParseDisabledCharacters(request.DisabledCharacters).ToList();
                    if (disabledNames.Count > 0) {
                        var existingDisableList = await db.DisableLists
                            .FirstOrDefaultAsync(l => l.UserId == userId && l.Name == "Disabled Characters");

                        var content = string.Join("\n", disabledNames);

                        if (existingDisableList is not null) {
                            var existingNames = existingDisableList.Content
                                .Split('\n', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                                .ToHashSet();
                            var newNames = disabledNames.Where(n => !existingNames.Contains(n)).ToList();
                            if (newNames.Count > 0) {
                                existingDisableList.Content = existingDisableList.Content + "\n" + string.Join("\n", newNames);
                                disabledImported = newNames.Count;
                            }
                        } else {
                            var newDisableList = new Core.Entities.DisableList {
                                UserId = userId.Value,
                                Name = "Disabled Characters",
                                Content = content,
                                IsActive = true
                            };
                            db.DisableLists.Add(newDisableList);
                            disabledImported = disabledNames.Count;
                        }
                    }
                }

                await db.SaveChangesAsync();

                Logger.LogInformation("Import completed: {Imported} imported, {Skipped} skipped, {Updated} updated, {ImagesQueued} images queued, {DisabledImported} disabled",
                    imported, skipped, updated, imageJobsCreated, disabledImported);

                return Results.Ok(new ImportResponse(imported, skipped, updated, new List<string>(), imageJobsCreated, disabledImported > 0 ? disabledImported : null));
            });

        group.MapPost("/process-images", async (
            ClaimsPrincipal user,
            MutilsDbContext db) => {
                var userId = GetUserId(user);
                if (userId is null) return Results.Unauthorized();

                var charactersNeedingImages = await db.CollectionEntries
                    .Where(e => e.UserId == userId && e.Character.StoredImageId == null && e.Character.OriginalImageUrl != null)
                    .Select(e => e.Character)
                    .Distinct()
                    .ToListAsync();

                if (charactersNeedingImages.Count == 0) {
                    return Results.Ok(new { queued = 0, message = "No images to process" });
                }

                var existingStoredUrls = await db.StoredImages
                    .Select(s => s.OriginalUrl)
                    .ToHashSetAsync();

                var pendingJobUrls = await db.ImageJobs
                    .Where(j => j.Status == ImageJobStatus.Pending)
                    .Select(j => j.OriginalUrl)
                    .ToHashSetAsync();

                var newJobs = new List<ImageJob>();
                foreach (var character in charactersNeedingImages) {
                    if (character.OriginalImageUrl is null)
                        continue;

                    if (existingStoredUrls.Contains(character.OriginalImageUrl))
                        continue;

                    if (pendingJobUrls.Contains(character.OriginalImageUrl))
                        continue;

                    newJobs.Add(new ImageJob {
                        CharacterId = character.Id,
                        OriginalUrl = character.OriginalImageUrl
                    });
                }

                if (newJobs.Count > 0) {
                    db.ImageJobs.AddRange(newJobs);
                    await db.SaveChangesAsync();
                }

                Logger.LogInformation("Queued {Count} images for processing for user {UserId}", newJobs.Count, userId);

                return Results.Ok(new { queued = newJobs.Count, message = $"Queued {newJobs.Count} images for background processing" });
            });

        group.MapGet("/image-status", async (
            ClaimsPrincipal user,
            MutilsDbContext db) => {
                var userId = GetUserId(user);
                if (userId is null) return Results.Unauthorized();

                var total = await db.CollectionEntries
                    .Where(e => e.UserId == userId && e.Character.OriginalImageUrl != null)
                    .CountAsync();

                var stored = await db.CollectionEntries
                    .Where(e => e.UserId == userId && e.Character.StoredImageId != null)
                    .CountAsync();

                var pending = await db.ImageJobs
                    .Where(j => j.Character.CollectionEntries.Any(e => e.UserId == userId) && j.Status == ImageJobStatus.Pending)
                    .CountAsync();

                var processing = await db.ImageJobs
                    .Where(j => j.Character.CollectionEntries.Any(e => e.UserId == userId) && j.Status == ImageJobStatus.Processing)
                    .CountAsync();

                var failed = await db.ImageJobs
                    .Where(j => j.Character.CollectionEntries.Any(e => e.UserId == userId) && j.Status == ImageJobStatus.Failed)
                    .CountAsync();

                return Results.Ok(new { total, stored, pending, processing, failed });
            });

        group.MapDelete("/clear", async (
            ClaimsPrincipal user,
            MutilsDbContext db) => {
                var userId = GetUserId(user);
                if (userId is null) return Results.Unauthorized();

                var entries = await db.CollectionEntries
                    .Where(e => e.UserId == userId)
                    .ToListAsync();

                db.CollectionEntries.RemoveRange(entries);
                await db.SaveChangesAsync();

                return Results.Ok(new { deleted = entries.Count });
            });

        group.MapPut("/{id}", async (
            Guid id,
            ClaimsPrincipal user,
            UpdateCollectionRequest request,
            MutilsDbContext db) => {
                var userId = GetUserId(user);
                if (userId is null) return Results.Unauthorized();

                var entry = await db.CollectionEntries
                    .Include(e => e.Character)
                    .FirstOrDefaultAsync(e => e.Id == id && e.UserId == userId);

                if (entry is null) return Results.NotFound();

                entry.Notes = request.Notes;
                
                if (request.KeyCount.HasValue) {
                    entry.Character.KeyCount = request.KeyCount;
                    entry.Character.KeyType = KeyHelper.GetKeyTypeFromCount(request.KeyCount);
                }
                
                await db.SaveChangesAsync();

                return Results.Ok(new { message = "Updated successfully" });
            });

        group.MapDelete("/{id}", async (
            Guid id,
            ClaimsPrincipal user,
            MutilsDbContext db) => {
                var userId = GetUserId(user);
                if (userId is null) return Results.Unauthorized();

                var entry = await db.CollectionEntries
                    .FirstOrDefaultAsync(e => e.Id == id && e.UserId == userId);

                if (entry is null) return Results.NotFound();

                db.CollectionEntries.Remove(entry);
                await db.SaveChangesAsync();

                return Results.NoContent();
            });

        group.MapGet("/images/{id}", async (
            Guid id,
            MutilsDbContext db,
            IStorageService storageService) => {
                var storedImage = await db.StoredImages.FindAsync(id);
                if (storedImage is null) return Results.NotFound();

                var stream = await storageService.GetImageAsync(storedImage.BucketName, storedImage.ObjectKey);
                if (stream is null) return Results.NotFound();

                return Results.Stream(stream, storedImage.ContentType);
            }).AllowAnonymous();
    }

    private static Guid? GetUserId(ClaimsPrincipal user) {
        var sub = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return sub is not null ? Guid.Parse(sub) : null;
    }
}

public record UpdateCollectionRequest(string? Notes, int? KeyCount = null);
