using Mutils.Core.Services;

namespace Mutils.Infrastructure.Services;

public class ExportService : IExportService {
    public string ExportToMudaeFormat(IEnumerable<string> characters) {
        return string.Join(", ", characters.Select(c => c.Trim()).Where(c => !string.IsNullOrEmpty(c)));
    }

    public string ExportToCommaSeparated(IEnumerable<string> characters) {
        return string.Join(", ", characters.Select(c => c.Trim()).Where(c => !string.IsNullOrEmpty(c)));
    }

    public string ExportToNewlineSeparated(IEnumerable<string> characters) {
        return string.Join("\n", characters.Select(c => c.Trim()).Where(c => !string.IsNullOrEmpty(c)));
    }
}
