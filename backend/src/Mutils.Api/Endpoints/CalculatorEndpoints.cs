using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using Mutils.Core.DTOs;
using Mutils.Infrastructure.Data;

namespace Mutils.Api.Endpoints;

public static class CalculatorEndpoints {
    public static void MapCalculatorEndpoints(this IEndpointRouteBuilder app) {
        var group = app.MapGroup("/api/calculator").RequireAuthorization().WithTags("Calculator");

        group.MapGet("/", async (
            ClaimsPrincipal user,
            MutilsDbContext db) => {
                var userId = GetUserId(user);
                if (userId is null) return Results.Unauthorized();

                var configs = await db.CalculatorConfigs
                    .Where(c => c.UserId == userId)
                    .OrderByDescending(c => c.CreatedAt)
                    .Select(c => new CalculatorConfigDto(
                        c.Id, c.Name, c.TotalPool, c.DisabledLimit, c.AntiDisabled,
                        c.SilverBadge, c.RubyBadge, c.BwLevel,
                        c.Perk2, c.Perk3, c.Perk4,
                        c.OwnedTotal, c.OwnedDisabled,
                        c.CreatedAt, c.UpdatedAt
                    ))
                    .ToListAsync();

                return Results.Ok(configs);
            });

        group.MapPost("/", async (
            ClaimsPrincipal user,
            CreateCalculatorConfigRequest request,
            MutilsDbContext db) => {
                var userId = GetUserId(user);
                if (userId is null) return Results.Unauthorized();

                var config = new Core.Entities.CalculatorConfig {
                    UserId = userId.Value,
                    Name = request.Name,
                    TotalPool = request.TotalPool,
                    DisabledLimit = request.DisabledLimit,
                    AntiDisabled = request.AntiDisabled,
                    SilverBadge = request.SilverBadge,
                    RubyBadge = request.RubyBadge,
                    BwLevel = request.BwLevel,
                    Perk2 = request.Perk2,
                    Perk3 = request.Perk3,
                    Perk4 = request.Perk4,
                    OwnedTotal = request.OwnedTotal,
                    OwnedDisabled = request.OwnedDisabled
                };

                db.CalculatorConfigs.Add(config);
                await db.SaveChangesAsync();

                return Results.Created($"/api/calculator/{config.Id}", new CalculatorConfigDto(
                    config.Id, config.Name, config.TotalPool, config.DisabledLimit, config.AntiDisabled,
                    config.SilverBadge, config.RubyBadge, config.BwLevel,
                    config.Perk2, config.Perk3, config.Perk4,
                    config.OwnedTotal, config.OwnedDisabled,
                    config.CreatedAt, config.UpdatedAt
                ));
            });

        group.MapPut("/{id}", async (
            Guid id,
            ClaimsPrincipal user,
            UpdateCalculatorConfigRequest request,
            MutilsDbContext db) => {
                var userId = GetUserId(user);
                if (userId is null) return Results.Unauthorized();

                var config = await db.CalculatorConfigs
                    .FirstOrDefaultAsync(c => c.Id == id && c.UserId == userId);
                if (config is null) return Results.NotFound();

                if (request.Name is not null) config.Name = request.Name;
                if (request.TotalPool.HasValue) config.TotalPool = request.TotalPool.Value;
                if (request.DisabledLimit.HasValue) config.DisabledLimit = request.DisabledLimit.Value;
                if (request.AntiDisabled.HasValue) config.AntiDisabled = request.AntiDisabled.Value;
                if (request.SilverBadge.HasValue) config.SilverBadge = request.SilverBadge.Value;
                if (request.RubyBadge.HasValue) config.RubyBadge = request.RubyBadge.Value;
                if (request.BwLevel.HasValue) config.BwLevel = request.BwLevel.Value;
                if (request.Perk2.HasValue) config.Perk2 = request.Perk2.Value;
                if (request.Perk3.HasValue) config.Perk3 = request.Perk3.Value;
                if (request.Perk4.HasValue) config.Perk4 = request.Perk4.Value;
                if (request.OwnedTotal.HasValue) config.OwnedTotal = request.OwnedTotal.Value;
                if (request.OwnedDisabled.HasValue) config.OwnedDisabled = request.OwnedDisabled.Value;

                await db.SaveChangesAsync();
                return Results.Ok(new CalculatorConfigDto(
                    config.Id, config.Name, config.TotalPool, config.DisabledLimit, config.AntiDisabled,
                    config.SilverBadge, config.RubyBadge, config.BwLevel,
                    config.Perk2, config.Perk3, config.Perk4,
                    config.OwnedTotal, config.OwnedDisabled,
                    config.CreatedAt, config.UpdatedAt
                ));
            });

        group.MapDelete("/{id}", async (
            Guid id,
            ClaimsPrincipal user,
            MutilsDbContext db) => {
                var userId = GetUserId(user);
                if (userId is null) return Results.Unauthorized();

                var config = await db.CalculatorConfigs
                    .FirstOrDefaultAsync(c => c.Id == id && c.UserId == userId);
                if (config is null) return Results.NotFound();

                db.CalculatorConfigs.Remove(config);
                await db.SaveChangesAsync();

                return Results.NoContent();
            });
    }

    private static Guid? GetUserId(ClaimsPrincipal user) {
        var sub = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return sub is not null ? Guid.Parse(sub) : null;
    }
}
