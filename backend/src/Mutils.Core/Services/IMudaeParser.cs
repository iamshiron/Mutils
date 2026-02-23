namespace Mutils.Core.Services;

public interface IMudaeParser {
    IEnumerable<ParsedCharacter> ParseCollection(string data);
}

public record ParsedCharacter(
    int Rank,
    string Name,
    int? Claims = null,
    int? Images = null,
    int? Gifs = null,
    int? SeriesCount = null,
    string? KeyType = null,
    int? KeyCount = null,
    int? Kakera = null,
    int? Sp = null,
    string? ImageUrl = null
);
