using Mutils.Core.DTOs;

namespace Mutils.Core.Services;

public interface IOptimizerService {
    Task<OptimizerAnalysisResponse> AnalyzeAsync(Guid userId, OptimizerAnalysisRequest request, CancellationToken cancellationToken = default);
    Task<OptimizerSuggestionsResponse> GetSuggestionsAsync(Guid userId, CancellationToken cancellationToken = default);
}
