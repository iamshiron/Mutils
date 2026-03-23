using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using Mutils.Core.DTOs;
using Mutils.Core.Entities;
using Mutils.Core.Services;
using Mutils.Infrastructure.Data;

namespace Mutils.Api.Endpoints;

public static class KakeraEndpoints {
    public static void MapKakeraEndpoints(this IEndpointRouteBuilder app) {
        var group = app.MapGroup("/api/kakera").RequireAuthorization().WithTags("Kakera");

        group.MapGet("/claims", async (
            ClaimsPrincipal user,
            MutilsDbContext db,
            DateTime? from,
            DateTime? to) => {
                var userId = GetUserId(user);
                if (userId is null) return Results.Unauthorized();

                var query = db.KakeraClaims
                    .Include(c => c.Character)
                    .Where(c => c.UserId == userId);

                if (from.HasValue)
                    query = query.Where(c => c.ClaimedAt >= from.Value);
                if (to.HasValue)
                    query = query.Where(c => c.ClaimedAt <= to.Value);

                var claims = await query
                    .OrderByDescending(c => c.ClaimedAt)
                    .Select(c => new KakeraClaimDto(
                        c.Id,
                        c.UserId,
                        c.CharacterId,
                        c.Character != null ? c.Character.Name : null,
                        c.Type,
                        c.Value,
                        c.IsClaimed,
                        c.ClaimedAt
                    ))
                    .ToListAsync();

                return Results.Ok(claims);
            });

        group.MapPost("/claims", async (
            ClaimsPrincipal user,
            CreateKakeraClaimRequest request,
            MutilsDbContext db) => {
                var userId = GetUserId(user);
                if (userId is null) return Results.Unauthorized();

                Guid? characterId = request.CharacterId;

                // If character ID is not provided but name is, try to find it
                if (characterId == null && !string.IsNullOrEmpty(request.CharacterName)) {
                    var character = await db.Characters
                        .FirstOrDefaultAsync(c => c.Name == request.CharacterName);
                    characterId = character?.Id;
                }

                var claim = new KakeraClaim {
                    UserId = userId.Value,
                    CharacterId = characterId,
                    Type = request.Type,
                    Value = request.Value,
                    IsClaimed = request.IsClaimed,
                    ClaimedAt = request.ClaimedAt ?? DateTime.UtcNow
                };

                db.KakeraClaims.Add(claim);
                await db.SaveChangesAsync();

                return Results.Created($"/api/kakera/claims/{claim.Id}", new KakeraClaimDto(
                    claim.Id,
                    claim.UserId,
                    claim.CharacterId,
                    request.CharacterName,
                    claim.Type,
                    claim.Value,
                    claim.IsClaimed,
                    claim.ClaimedAt
                ));
            });

        group.MapGet("/stats", async (
            ClaimsPrincipal user,
            MutilsDbContext db) => {
                var userId = GetUserId(user);
                if (userId is null) return Results.Unauthorized();

                var claims = await db.KakeraClaims
                    .Where(c => c.UserId == userId)
                    .ToListAsync();

                var stats = new {
                    TotalValue = claims.Sum(c => c.Value),
                    TotalCount = claims.Count,
                    ByType = claims.GroupBy(c => c.Type)
                        .ToDictionary(
                            g => g.Key.ToString(),
                            g => new {
                                Count = g.Count(),
                                TotalValue = g.Sum(c => c.Value)
                            }
                        )
                };

                return Results.Ok(stats);
            });

        group.MapDelete("/claims/{id}", async (
            Guid id,
            ClaimsPrincipal user,
            MutilsDbContext db) => {
                var userId = GetUserId(user);
                if (userId is null) return Results.Unauthorized();

                var claim = await db.KakeraClaims
                    .FirstOrDefaultAsync(c => c.Id == id && c.UserId == userId);

                if (claim is null) return Results.NotFound();

                db.KakeraClaims.Remove(claim);
                await db.SaveChangesAsync();

                return Results.NoContent();
            });

        group.MapPut("/claims/{id}", async (
            Guid id,
            ClaimsPrincipal user,
            UpdateKakeraClaimRequest request,
            MutilsDbContext db) => {
                var userId = GetUserId(user);
                if (userId is null) return Results.Unauthorized();

                var claim = await db.KakeraClaims
                    .Include(c => c.Character)
                    .FirstOrDefaultAsync(c => c.Id == id && c.UserId == userId);

                if (claim is null) return Results.NotFound();

                Guid? characterId = null;
                if (!string.IsNullOrEmpty(request.CharacterName)) {
                    var character = await db.Characters
                        .FirstOrDefaultAsync(c => c.Name == request.CharacterName);
                    characterId = character?.Id;
                }

                claim.CharacterId = characterId;
                claim.Type = request.Type;
                claim.Value = request.Value;
                claim.IsClaimed = request.IsClaimed;
                claim.ClaimedAt = request.ClaimedAt ?? claim.ClaimedAt;

                await db.SaveChangesAsync();

                return Results.Ok(new KakeraClaimDto(
                    claim.Id,
                    claim.UserId,
                    claim.CharacterId,
                    request.CharacterName ?? (claim.Character != null ? claim.Character.Name : null),
                    claim.Type,
                    claim.Value,
                    claim.IsClaimed,
                    claim.ClaimedAt
                ));
            });

        group.MapGet("/export", async (
            ClaimsPrincipal user,
            MutilsDbContext db) => {
                var userId = GetUserId(user);
                if (userId is null) return Results.Unauthorized();

                var claims = await db.KakeraClaims
                    .Include(c => c.Character)
                    .Where(c => c.UserId == userId)
                    .OrderByDescending(c => c.ClaimedAt)
                    .Select(c => new {
                        c.Id,
                        CharacterName = c.Character != null ? c.Character.Name : null,
                        c.Type,
                        c.Value,
                        c.IsClaimed,
                        c.ClaimedAt
                    })
                    .ToListAsync();

                return Results.Ok(claims);
            });

        group.MapPost("/import", async (
            ClaimsPrincipal user,
            List<ImportKakeraClaimItem> claims,
            MutilsDbContext db) => {
                var userId = GetUserId(user);
                if (userId is null) return Results.Unauthorized();

                var existingClaims = await db.KakeraClaims
                    .Where(c => c.UserId == userId)
                    .ToListAsync();
                db.KakeraClaims.RemoveRange(existingClaims);

                var imported = 0;
                foreach (var item in claims) {
                    Guid? characterId = null;
                    if (!string.IsNullOrEmpty(item.CharacterName)) {
                        var character = await db.Characters
                            .FirstOrDefaultAsync(c => c.Name == item.CharacterName);
                        characterId = character?.Id;
                    }

                    var claim = new KakeraClaim {
                        Id = item.Id,
                        UserId = userId.Value,
                        CharacterId = characterId,
                        Type = item.Type,
                        Value = item.Value,
                        IsClaimed = item.IsClaimed,
                        ClaimedAt = item.ClaimedAt
                    };
                    db.KakeraClaims.Add(claim);
                    imported++;
                }

                await db.SaveChangesAsync();
                return Results.Ok(new { Imported = imported });
            });

        group.MapDelete("/claims", async (
            ClaimsPrincipal user,
            MutilsDbContext db) => {
                var userId = GetUserId(user);
                if (userId is null) return Results.Unauthorized();

                try {
                    var claims = await db.KakeraClaims
                        .Where(c => c.UserId == userId)
                        .ToListAsync();

                    db.KakeraClaims.RemoveRange(claims);
                    await db.SaveChangesAsync();

                    return Results.Ok(new { Deleted = claims.Count });
                } catch (Exception ex) {
                    var errorMsg = ex.InnerException?.Message ?? ex.Message;
                    return Results.BadRequest(new { Error = errorMsg });
                }
            });

        group.MapPost("/bulk-import", async (
            ClaimsPrincipal user,
            BulkKakeraImportRequest request,
            IKakeraLogParser parser,
            MutilsDbContext db) => {
                var userId = GetUserId(user);
                if (userId is null) return Results.Unauthorized();

                var errors = new List<string>();

                if (string.IsNullOrEmpty(request.Data)) {
                    errors.Add("No data provided - request.Data is null or empty");
                    return Results.Ok(new BulkKakeraImportResponse(0, 0, errors));
                }

                try {
                    var parsedClaims = parser.ParseKakeraLog(request.Data).ToList();
                    var imported = 0;
                    var skipped = 0;

                    if (parsedClaims.Count == 0) {
                        errors.Add($"No claims parsed from data. Length={request.Data.Length}");
                        var preview = request.Data.Length > 300 ? request.Data[..300] : request.Data;
                        errors.Add($"Preview: {preview}");
                    }

                    Guid? characterId = null;
                    if (!string.IsNullOrEmpty(request.CharacterName)) {
                        var character = await db.Characters
                            .FirstOrDefaultAsync(c => c.Name == request.CharacterName);
                        characterId = character?.Id;
                    }

                    foreach (var parsed in parsedClaims) {
                        if (parsed.Value <= 0) {
                            skipped++;
                            continue;
                        }

                        var claim = new KakeraClaim {
                            UserId = userId.Value,
                            CharacterId = characterId,
                            Type = parsed.Type,
                            Value = parsed.Value,
                            IsClaimed = true,
                            ClaimedAt = parsed.ClaimedAt ?? DateTime.UtcNow
                        };
                        db.KakeraClaims.Add(claim);
                        imported++;
                    }

                    await db.SaveChangesAsync();
                    return Results.Ok(new BulkKakeraImportResponse(imported, skipped, errors));
                } catch (Exception ex) {
                    errors.Add($"Exception: {ex.Message}");
                    if (ex.InnerException != null) {
                        errors.Add($"Inner: {ex.InnerException.Message}");
                    }
                    return Results.Ok(new BulkKakeraImportResponse(0, 0, errors));
                }
            });
    }

    private static Guid? GetUserId(ClaimsPrincipal user) {
        var sub = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return sub is not null ? Guid.Parse(sub) : null;
    }
}
