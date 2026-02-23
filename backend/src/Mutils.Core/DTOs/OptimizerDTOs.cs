namespace Mutils.Core.DTOs;

public sealed record OptimizerAnalysisRequest(
    bool IncludeWishlist = false
);

public sealed record OptimizerAnalysisResponse(
    int TotalCharacters,
    int TotalKakera,
    Dictionary<string, int> KeyDistribution,
    IReadOnlyList<OptimizerRecommendation> Recommendations
);

public sealed record OptimizerRecommendation(
    string Type,
    string Series,
    string Reason,
    string Impact
);

public sealed record OptimizerSuggestionDto(
    Guid Id,
    string Type,
    IReadOnlyList<string> Characters,
    string Reason,
    int Priority
);

public sealed record OptimizerSuggestionsResponse(IReadOnlyList<OptimizerSuggestionDto> Suggestions);
