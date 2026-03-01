using Mutils.Core.DTOs;

namespace Mutils.Core.Services;

public interface IKakeraLogParser {
    IEnumerable<ParsedKakeraClaim> ParseKakeraLog(string data);
}
