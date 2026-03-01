using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using Mutils.Core.DTOs;
using Mutils.Core.Entities;
using Mutils.Infrastructure.Data;

namespace Mutils.Api.Endpoints;

public static class KakeraEndpoints {
    public static void MapKakeraEndpoints(this IEndpointRouteBuilder app) {
        var group = app.MapGroup("/api/kakera").RequireAuthorization();

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
    }

    private static Guid? GetUserId(ClaimsPrincipal user) {
        var sub = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return sub is not null ? Guid.Parse(sub) : null;
    }
}
