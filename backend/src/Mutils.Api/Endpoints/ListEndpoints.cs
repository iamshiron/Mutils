using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using Mutils.Core.DTOs;
using Mutils.Core.Services;
using Mutils.Infrastructure.Data;

namespace Mutils.Api.Endpoints;

public static class ListEndpoints {
    public static void MapListEndpoints(this IEndpointRouteBuilder app) {
        var group = app.MapGroup("/api/lists").RequireAuthorization();

        group.MapGet("/enable", async (
            ClaimsPrincipal user,
            MutilsDbContext db) => {
                var userId = GetUserId(user);
                if (userId is null) return Results.Unauthorized();

                var lists = await db.EnableLists
                    .Where(l => l.UserId == userId)
                    .Select(l => new EnableListDto(
                        l.Id, l.Name, l.Content, l.IsActive, l.CreatedAt, l.UpdatedAt
                    ))
                    .ToListAsync();

                return Results.Ok(lists);
            });

        group.MapPost("/enable", async (
            ClaimsPrincipal user,
            CreateListRequest request,
            MutilsDbContext db) => {
                var userId = GetUserId(user);
                if (userId is null) return Results.Unauthorized();

                var list = new Core.Entities.EnableList {
                    UserId = userId.Value,
                    Name = request.Name,
                    Content = request.Content,
                    IsActive = request.IsActive
                };

                db.EnableLists.Add(list);
                await db.SaveChangesAsync();

                return Results.Created($"/api/lists/enable/{list.Id}", new EnableListDto(
                    list.Id, list.Name, list.Content, list.IsActive, list.CreatedAt, list.UpdatedAt
                ));
            });

        group.MapGet("/disable", async (
            ClaimsPrincipal user,
            MutilsDbContext db) => {
                var userId = GetUserId(user);
                if (userId is null) return Results.Unauthorized();

                var lists = await db.DisableLists
                    .Where(l => l.UserId == userId)
                    .Select(l => new DisableListDto(
                        l.Id, l.Name, l.Content, l.IsActive, l.CreatedAt, l.UpdatedAt
                    ))
                    .ToListAsync();

                return Results.Ok(lists);
            });

        group.MapPost("/disable", async (
            ClaimsPrincipal user,
            CreateListRequest request,
            MutilsDbContext db) => {
                var userId = GetUserId(user);
                if (userId is null) return Results.Unauthorized();

                var list = new Core.Entities.DisableList {
                    UserId = userId.Value,
                    Name = request.Name,
                    Content = request.Content,
                    IsActive = request.IsActive
                };

                db.DisableLists.Add(list);
                await db.SaveChangesAsync();

                return Results.Created($"/api/lists/disable/{list.Id}", new DisableListDto(
                    list.Id, list.Name, list.Content, list.IsActive, list.CreatedAt, list.UpdatedAt
                ));
            });

        group.MapPut("/{type}/{id}", async (
            string type,
            Guid id,
            ClaimsPrincipal user,
            UpdateListRequest request,
            MutilsDbContext db) => {
                var userId = GetUserId(user);
                if (userId is null) return Results.Unauthorized();

                if (type == "enable") {
                    var list = await db.EnableLists
                        .FirstOrDefaultAsync(l => l.Id == id && l.UserId == userId);
                    if (list is null) return Results.NotFound();

                    if (request.Name is not null) list.Name = request.Name;
                    if (request.Content is not null) list.Content = request.Content;
                    if (request.IsActive.HasValue) list.IsActive = request.IsActive.Value;
                } else if (type == "disable") {
                    var list = await db.DisableLists
                        .FirstOrDefaultAsync(l => l.Id == id && l.UserId == userId);
                    if (list is null) return Results.NotFound();

                    if (request.Name is not null) list.Name = request.Name;
                    if (request.Content is not null) list.Content = request.Content;
                    if (request.IsActive.HasValue) list.IsActive = request.IsActive.Value;
                } else {
                    return Results.BadRequest("Invalid list type");
                }

                await db.SaveChangesAsync();
                return Results.Ok(new { message = "Updated successfully" });
            });

        group.MapDelete("/{type}/{id}", async (
            string type,
            Guid id,
            ClaimsPrincipal user,
            MutilsDbContext db) => {
                var userId = GetUserId(user);
                if (userId is null) return Results.Unauthorized();

                if (type == "enable") {
                    var list = await db.EnableLists
                        .FirstOrDefaultAsync(l => l.Id == id && l.UserId == userId);
                    if (list is null) return Results.NotFound();
                    db.EnableLists.Remove(list);
                } else if (type == "disable") {
                    var list = await db.DisableLists
                        .FirstOrDefaultAsync(l => l.Id == id && l.UserId == userId);
                    if (list is null) return Results.NotFound();
                    db.DisableLists.Remove(list);
                } else {
                    return Results.BadRequest("Invalid list type");
                }

                await db.SaveChangesAsync();
                return Results.NoContent();
            });

        group.MapGet("/presets", async (
            ClaimsPrincipal user,
            MutilsDbContext db,
            string? type) => {
                var userId = GetUserId(user);
                if (userId is null) return Results.Unauthorized();

                var query = db.ListPresets.Where(p => p.UserId == userId);

                if (!string.IsNullOrEmpty(type)) {
                    query = query.Where(p => p.Type == type);
                }

                var presets = await query
                    .Select(p => new ListPresetDto(
                        p.Id, p.Name, p.Type, p.Content, p.CreatedAt, p.UpdatedAt
                    ))
                    .ToListAsync();

                return Results.Ok(presets);
            });

        group.MapPost("/export", (
            ExportRequest request,
            IExportService exportService) => {
                var characters = request.Format.ToLower() switch {
                    "comma" or "mudae" => exportService.ExportToCommaSeparated([]),
                    "newline" => exportService.ExportToNewlineSeparated([]),
                    _ => exportService.ExportToMudaeFormat([])
                };

                return Results.Ok(new ExportResponse(characters, 0));
            });

        group.MapGet("/wishlist", async (
            ClaimsPrincipal user,
            MutilsDbContext db,
            bool? isStarwish,
            string? search,
            int page = 1,
            int pageSize = 50) => {
                var userId = GetUserId(user);
                if (userId is null) return Results.Unauthorized();

                var query = db.WishlistEntries
                    .Include(w => w.Character)
                        .ThenInclude(c => c!.Series)
                    .Include(w => w.Character)
                        .ThenInclude(c => c!.StoredImage)
                    .Where(w => w.UserId == userId);

                if (isStarwish.HasValue) {
                    query = query.Where(w => w.IsStarwish == isStarwish.Value);
                }

                if (!string.IsNullOrEmpty(search)) {
                    query = query.Where(w => w.Character!.Name.Contains(search) ||
                        (w.Character!.Series != null && w.Character.Series.Name.Contains(search)));
                }

                var totalCount = await query.CountAsync();

                var entries = await query
                    .OrderByDescending(w => w.IsStarwish)
                    .ThenBy(w => w.Priority)
                    .ThenBy(w => w.Character!.Rank ?? int.MaxValue)
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .Select(w => new WishlistEntryDto(
                        w.Id,
                        w.CharacterId,
                        w.Character!.Name,
                        w.Character.Rank,
                        w.Character.Kakera,
                        w.Character.KeyCount,
                        w.Character.KeyType,
                        w.Character.Series != null ? w.Character.Series.Name : null,
                        w.Character.OriginalImageUrl,
                        w.Character.StoredImageId,
                        w.IsStarwish,
                        w.Priority,
                        w.Notes,
                        w.CreatedAt,
                        w.UpdatedAt
                    ))
                    .ToListAsync();

                return Results.Ok(new {
                    items = entries,
                    total = totalCount,
                    page,
                    pageSize,
                    totalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
                });
            });

        group.MapGet("/wishlist/stats", async (
            ClaimsPrincipal user,
            MutilsDbContext db) => {
                var userId = GetUserId(user);
                if (userId is null) return Results.Unauthorized();

                var total = await db.WishlistEntries.CountAsync(w => w.UserId == userId);
                var starwishCount = await db.WishlistEntries.CountAsync(w => w.UserId == userId && w.IsStarwish);

                return Results.Ok(new WishlistStatsDto(total, starwishCount, total - starwishCount));
            });

        group.MapPost("/wishlist", async (
            ClaimsPrincipal user,
            CreateWishlistEntryRequest request,
            MutilsDbContext db) => {
                var userId = GetUserId(user);
                if (userId is null) return Results.Unauthorized();

                var existing = await db.WishlistEntries
                    .FirstOrDefaultAsync(w => w.UserId == userId && w.CharacterId == request.CharacterId);
                if (existing is not null) {
                    return Results.BadRequest("Character already in wishlist");
                }

                var character = await db.Characters.FindAsync(request.CharacterId);
                if (character is null) return Results.NotFound("Character not found");

                var entry = new Core.Entities.WishlistEntry {
                    UserId = userId.Value,
                    CharacterId = request.CharacterId,
                    IsStarwish = request.IsStarwish,
                    Priority = request.Priority,
                    Notes = request.Notes
                };

                db.WishlistEntries.Add(entry);
                await db.SaveChangesAsync();

                var series = character.SeriesId.HasValue
                    ? await db.Series.FindAsync(character.SeriesId)
                    : null;

                return Results.Created($"/api/lists/wishlist/{entry.Id}", new WishlistEntryDto(
                    entry.Id,
                    entry.CharacterId,
                    character.Name,
                    character.Rank,
                    character.Kakera,
                    character.KeyCount,
                    character.KeyType,
                    series?.Name,
                    character.OriginalImageUrl,
                    character.StoredImageId,
                    entry.IsStarwish,
                    entry.Priority,
                    entry.Notes,
                    entry.CreatedAt,
                    entry.UpdatedAt
                ));
            });

        group.MapPut("/wishlist/{id}", async (
            Guid id,
            ClaimsPrincipal user,
            UpdateWishlistEntryRequest request,
            MutilsDbContext db) => {
                var userId = GetUserId(user);
                if (userId is null) return Results.Unauthorized();

                var entry = await db.WishlistEntries
                    .FirstOrDefaultAsync(w => w.Id == id && w.UserId == userId);
                if (entry is null) return Results.NotFound();

                if (request.IsStarwish.HasValue) entry.IsStarwish = request.IsStarwish.Value;
                if (request.Priority.HasValue) entry.Priority = request.Priority.Value;
                if (request.Notes is not null) entry.Notes = request.Notes;

                await db.SaveChangesAsync();
                return Results.Ok(new { message = "Updated successfully" });
            });

        group.MapDelete("/wishlist/{id}", async (
            Guid id,
            ClaimsPrincipal user,
            MutilsDbContext db) => {
                var userId = GetUserId(user);
                if (userId is null) return Results.Unauthorized();

                var entry = await db.WishlistEntries
                    .FirstOrDefaultAsync(w => w.Id == id && w.UserId == userId);
                if (entry is null) return Results.NotFound();

                db.WishlistEntries.Remove(entry);
                await db.SaveChangesAsync();

                return Results.NoContent();
            });

        group.MapPost("/wishlist/toggle-starwish/{id}", async (
            Guid id,
            ClaimsPrincipal user,
            MutilsDbContext db) => {
                var userId = GetUserId(user);
                if (userId is null) return Results.Unauthorized();

                var entry = await db.WishlistEntries
                    .FirstOrDefaultAsync(w => w.Id == id && w.UserId == userId);
                if (entry is null) return Results.NotFound();

                entry.IsStarwish = !entry.IsStarwish;
                await db.SaveChangesAsync();

                return Results.Ok(new { isStarwish = entry.IsStarwish });
            });
    }

    private static Guid? GetUserId(ClaimsPrincipal user) {
        var sub = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return sub is not null ? Guid.Parse(sub) : null;
    }
}
