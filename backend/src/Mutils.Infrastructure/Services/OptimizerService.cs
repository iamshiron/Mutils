using Microsoft.EntityFrameworkCore;
using Mutils.Core.DTOs;
using Mutils.Core.Services;
using Mutils.Core.Helpers;
using Mutils.Infrastructure.Data;

namespace Mutils.Infrastructure.Services;

public class OptimizerService(MutilsDbContext dbContext) : IOptimizerService {
    public async Task<OptimizerAnalysisResponse> AnalyzeAsync(
        Guid userId,
        OptimizerAnalysisRequest request,
        CancellationToken cancellationToken = default) {
        var entries = await dbContext.CollectionEntries
            .Include(e => e.Character)
            .Where(e => e.UserId == userId)
            .ToListAsync(cancellationToken);

        var characters = entries.Select(e => e.Character).ToList();
        var totalCharacters = characters.Count;
        var totalKakera = characters.Sum(c => c.Kakera ?? 0);

        var keyDistribution = characters
            .Select(c => new { KeyType = KeyHelper.GetKeyTypeFromCount(c.KeyCount) })
            .Where(c => c.KeyType is not null)
            .GroupBy(c => c.KeyType!)
            .ToDictionary(g => g.Key, g => g.Count());

        var recommendations = GenerateRecommendations(characters);

        return new OptimizerAnalysisResponse(
            totalCharacters,
            totalKakera,
            keyDistribution,
            recommendations
        );
    }

    public async Task<OptimizerSuggestionsResponse> GetSuggestionsAsync(
        Guid userId,
        CancellationToken cancellationToken = default) {
        var entries = await dbContext.CollectionEntries
            .Include(e => e.Character)
            .Where(e => e.UserId == userId)
            .ToListAsync(cancellationToken);

        var suggestions = GenerateSuggestions(entries.Select(e => e.Character).ToList());

        return new OptimizerSuggestionsResponse(suggestions);
    }

    private static List<OptimizerRecommendation> GenerateRecommendations(List<Core.Entities.Character> characters) {
        var recommendations = new List<OptimizerRecommendation>();

        var topByKakera = characters
            .OrderByDescending(c => c.Kakera ?? 0)
            .Take(5)
            .ToList();

        foreach (var character in topByKakera) {
            recommendations.Add(new OptimizerRecommendation(
                Type: "priority",
                Series: character.Name,
                Reason: $"High kakera value: {character.Kakera} ka",
                Impact: character.Kakera >= 600 ? "high" : character.Kakera >= 400 ? "medium" : "low"
            ));
        }

        return recommendations;
    }

    private static List<OptimizerSuggestionDto> GenerateSuggestions(List<Core.Entities.Character> characters) {
        var suggestions = new List<OptimizerSuggestionDto>();
        var priority = 1;

        var highValueChars = characters
            .Where(c => (c.Kakera ?? 0) >= 500)
            .OrderByDescending(c => c.Kakera ?? 0)
            .Take(10)
            .ToList();

        if (highValueChars.Count > 0) {
            suggestions.Add(new OptimizerSuggestionDto(
                Id: Guid.CreateVersion7(),
                Type: "enable",
                Characters: highValueChars.Select(c => c.Name).ToList(),
                Reason: $"Enable {highValueChars.Count} high-value characters (500+ ka)",
                Priority: priority++
            ));
        }

        var keyChars = characters
            .Where(c => c.KeyCount.HasValue && c.KeyCount.Value >= 1)
            .Select(c => new { Character = c, KeyType = KeyHelper.GetKeyTypeFromCount(c.KeyCount) })
            .OrderByDescending(c => c.Character.Kakera ?? 0)
            .ToList();

        if (keyChars.Count > 0) {
            var keyGroups = keyChars.GroupBy(c => c.KeyType!);
            foreach (var group in keyGroups.Take(3)) {
                suggestions.Add(new OptimizerSuggestionDto(
                    Id: Guid.CreateVersion7(),
                    Type: "enable",
                    Characters: group.Select(c => c.Character.Name).ToList(),
                    Reason: $"Enable {group.Count()} {group.Key} characters",
                    Priority: priority++
                ));
            }
        }

        return suggestions;
    }
}
