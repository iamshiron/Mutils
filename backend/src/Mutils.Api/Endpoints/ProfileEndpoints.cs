using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using Mutils.Core.DTOs;
using Mutils.Core.Entities;
using Mutils.Infrastructure.Data;

namespace Mutils.Api.Endpoints;

public static class ProfileEndpoints {
    public static void MapProfileEndpoints(this IEndpointRouteBuilder app) {
        var group = app.MapGroup("/api/profile").RequireAuthorization();

        group.MapGet("/", async (
            ClaimsPrincipal user,
            MutilsDbContext db) => {
                var userId = GetUserId(user);
                if (userId is null) return Results.Unauthorized();

                var profile = await db.UserProfiles
                    .FirstOrDefaultAsync(p => p.UserId == userId);

                if (profile is null) {
                    profile = new UserProfile { UserId = userId.Value };
                    db.UserProfiles.Add(profile);
                    await db.SaveChangesAsync();
                }

                return Results.Ok(ToDto(profile));
            });

        group.MapPut("/", async (
            ClaimsPrincipal user,
            UpdateProfileRequest request,
            MutilsDbContext db) => {
                var userId = GetUserId(user);
                if (userId is null) return Results.Unauthorized();

                var profile = await db.UserProfiles
                    .FirstOrDefaultAsync(p => p.UserId == userId);

                if (profile is null) {
                    profile = new UserProfile { UserId = userId.Value };
                    db.UserProfiles.Add(profile);
                }

                if (request.BronzeBadge.HasValue) profile.BronzeBadge = request.BronzeBadge.Value;
                if (request.SilverBadge.HasValue) profile.SilverBadge = request.SilverBadge.Value;
                if (request.GoldBadge.HasValue) profile.GoldBadge = request.GoldBadge.Value;
                if (request.SapphireBadge.HasValue) profile.SapphireBadge = request.SapphireBadge.Value;
                if (request.RubyBadge.HasValue) profile.RubyBadge = request.RubyBadge.Value;
                if (request.EmeraldBadge.HasValue) profile.EmeraldBadge = request.EmeraldBadge.Value;
                if (request.DiamondBadge.HasValue) profile.DiamondBadge = request.DiamondBadge.Value;
                if (request.TowerPerk1.HasValue) profile.TowerPerk1 = request.TowerPerk1.Value;
                if (request.TowerPerk2.HasValue) profile.TowerPerk2 = request.TowerPerk2.Value;
                if (request.TowerPerk3.HasValue) profile.TowerPerk3 = request.TowerPerk3.Value;
                if (request.TowerPerk4.HasValue) profile.TowerPerk4 = request.TowerPerk4.Value;
                if (request.TowerPerk5.HasValue) profile.TowerPerk5 = request.TowerPerk5.Value;
                if (request.TowerPerk6.HasValue) profile.TowerPerk6 = request.TowerPerk6.Value;
                if (request.TowerPerk7.HasValue) profile.TowerPerk7 = request.TowerPerk7.Value;
                if (request.TowerPerk8.HasValue) profile.TowerPerk8 = request.TowerPerk8.Value;
                if (request.TowerPerk9.HasValue) profile.TowerPerk9 = request.TowerPerk9.Value;
                if (request.TowerPerk10.HasValue) profile.TowerPerk10 = request.TowerPerk10.Value;
                if (request.TowerPerk11.HasValue) profile.TowerPerk11 = request.TowerPerk11.Value;
                if (request.TowerPerk12.HasValue) profile.TowerPerk12 = request.TowerPerk12.Value;

                await db.SaveChangesAsync();
                return Results.Ok(ToDto(profile));
            });
    }

    private static UserProfileDto ToDto(UserProfile p) => new(
        p.Id,
        p.BronzeBadge, p.SilverBadge, p.GoldBadge, p.SapphireBadge,
        p.RubyBadge, p.EmeraldBadge, p.DiamondBadge,
        p.TowerPerk1, p.TowerPerk2, p.TowerPerk3, p.TowerPerk4,
        p.TowerPerk5, p.TowerPerk6, p.TowerPerk7, p.TowerPerk8,
        p.TowerPerk9, p.TowerPerk10, p.TowerPerk11, p.TowerPerk12,
        p.CreatedAt, p.UpdatedAt
    );

    private static Guid? GetUserId(ClaimsPrincipal user) {
        var sub = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return sub is not null ? Guid.Parse(sub) : null;
    }
}
