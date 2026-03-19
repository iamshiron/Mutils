using System.Text.RegularExpressions;
using Mutils.Core.Services;
using Mutils.Core.Helpers;

namespace Mutils.Infrastructure.Services;

public partial class MudaeParser : IMudaeParser {
    public IEnumerable<ParsedCharacter> ParseCollection(string data) {
        var lines = data.Split('\n', StringSplitOptions.RemoveEmptyEntries);
        foreach (var line in lines) {
            var trimmed = line.Trim();
            if (string.IsNullOrEmpty(trimmed))
                continue;

            var parsed = ParseLine(trimmed);
            if (parsed is not null)
                yield return parsed;
        }
    }

    public IEnumerable<string> ParseDisabledCharacters(string data) {
        var lines = data.Split('\n', StringSplitOptions.RemoveEmptyEntries);
        foreach (var line in lines) {
            var trimmed = line.Trim();
            if (string.IsNullOrEmpty(trimmed))
                continue;

            var name = ParseDisabledLine(trimmed);
            if (name is not null)
                yield return name;
        }
    }

    private static string? ParseDisabledLine(string line) {
        var match = DisabledLineRegex().Match(line);
        if (!match.Success)
            return null;

        return match.Groups["name"].Value.Trim();
    }

    private static ParsedCharacter? ParseLine(string line) {
        var match = CollectionLineRegex().Match(line);
        if (!match.Success)
            return null;

        var rank = ParseInt(match.Groups["rank"].Value) ?? 0;
        var name = match.Groups["name"].Value.Trim();
        var claims = ParseInt(match.Groups["claims"].Value);
        var images = ParseInt(match.Groups["images"].Value);
        var gifs = ParseInt(match.Groups["gifs"].Value);
        var seriesCount = ParseInt(match.Groups["series"].Value);
        var keyCount = match.Groups["keyCount"].Success ? ParseInt(match.Groups["keyCount"].Value) : null;
        var keyType = KeyHelper.GetKeyTypeFromCount(keyCount);
        var kakera = ParseInt(match.Groups["kakera"].Value);
        var sp = match.Groups["sp"].Success ? ParseInt(match.Groups["sp"].Value) : null;
        var imageUrl = match.Groups["imageUrl"].Success ? match.Groups["imageUrl"].Value.Trim() : null;

        return new ParsedCharacter(
            Rank: rank,
            Name: name,
            Claims: claims,
            Images: images,
            Gifs: gifs,
            SeriesCount: seriesCount,
            KeyType: keyType,
            KeyCount: keyCount,
            Kakera: kakera,
            Sp: sp,
            ImageUrl: imageUrl
        );
    }

    private static int? ParseInt(string value) {
        return int.TryParse(value.Replace(",", ""), out var result) ? result : null;
    }

    [GeneratedRegex(
        @"^#(?<rank>[\d,]+)\s*-\s*(?<name>.+?)\s*=>\s*(?<claims>\d+)\s*al(?:\s*,\s*(?<images>\d+)\s*img(?:\s*\+\s*(?<gifs>\d+)\s*gif)?)?(?:\s*,\s*(?<series>\d+)\s*series)?(?:\s*·\s*:(?<keyType>\w+key):\s*\((?<keyCount>\d+)\))?\s*(?<kakera>[\d,]+)\s*ka(?:\s*(?<sp>[\d,]+)\s*sp)?(?:\s*-\s*(?<imageUrl>https?://\S+))?\s*$",
        RegexOptions.IgnoreCase | RegexOptions.Compiled)]
    private static partial Regex CollectionLineRegex();

    [GeneratedRegex(
        @"^(?<name>.+?)\s*🚫\s*$",
        RegexOptions.Compiled)]
    private static partial Regex DisabledLineRegex();
}
