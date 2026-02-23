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
    }

    private static Guid? GetUserId(ClaimsPrincipal user) {
        var sub = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return sub is not null ? Guid.Parse(sub) : null;
    }
}
