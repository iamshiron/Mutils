using System.Security.Claims;
using Mutils.Core.DTOs;
using Mutils.Core.Services;

namespace Mutils.Api.Endpoints;

public static class OptimizerEndpoints {
    public static void MapOptimizerEndpoints(this IEndpointRouteBuilder app) {
        var group = app.MapGroup("/api/optimizer").RequireAuthorization().WithTags("Optimizer");

        group.MapPost("/analyze", async (
            ClaimsPrincipal user,
            OptimizerAnalysisRequest request,
            IOptimizerService optimizerService) => {
                var userId = GetUserId(user);
                if (userId is null) return Results.Unauthorized();

                var result = await optimizerService.AnalyzeAsync(userId.Value, request);
                return Results.Ok(result);
            });

        group.MapGet("/suggest", async (
            ClaimsPrincipal user,
            IOptimizerService optimizerService) => {
                var userId = GetUserId(user);
                if (userId is null) return Results.Unauthorized();

                var result = await optimizerService.GetSuggestionsAsync(userId.Value);
                return Results.Ok(result);
            });
    }

    private static Guid? GetUserId(ClaimsPrincipal user) {
        var sub = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return sub is not null ? Guid.Parse(sub) : null;
    }
}
