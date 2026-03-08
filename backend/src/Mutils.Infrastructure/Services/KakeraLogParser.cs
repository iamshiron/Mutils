using System.Globalization;
using System.Text.RegularExpressions;
using Mutils.Core.DTOs;
using Mutils.Core.Entities;
using Mutils.Core.Services;

namespace Mutils.Infrastructure.Services;

public partial class KakeraLogParser : IKakeraLogParser {
    private static readonly Dictionary<string, KakeraType> KakeraTypeMap = new() {
        { "", KakeraType.Blue },
        { "P", KakeraType.Purple },
        { "T", KakeraType.Teal },
        { "G", KakeraType.Green },
        { "Y", KakeraType.Yellow },
        { "O", KakeraType.Orange },
        { "R", KakeraType.Red },
        { "L", KakeraType.Light },
        { "D", KakeraType.Dark },
        { "C", KakeraType.Chaos },
        { "W", KakeraType.Rainbow }
    };

    public IEnumerable<ParsedKakeraClaim> ParseKakeraLog(string data) {
        var lines = data.Split('\n', StringSplitOptions.RemoveEmptyEntries);
        KakeraType? darkTransformedTo = null;
        DateTime? currentDate = null;

        foreach (var line in lines) {
            var trimmed = line.Trim();
            if (string.IsNullOrEmpty(trimmed))
                continue;

            var dateMatch = DateLineRegex().Match(trimmed);
            if (dateMatch.Success) {
                if (DateTime.TryParseExact(
                    dateMatch.Value,
                    "M/d/yyyy h:mm tt",
                    CultureInfo.InvariantCulture,
                    DateTimeStyles.None,
                    out var parsedDate)) {
                    currentDate = DateTime.SpecifyKind(parsedDate, DateTimeKind.Utc);
                }
                continue;
            }

            var isoDateMatch = IsoDateLineRegex().Match(trimmed);
            if (isoDateMatch.Success) {
                if (DateTime.TryParseExact(
                    isoDateMatch.Value,
                    "yyyy-MM-dd HH:mm",
                    CultureInfo.InvariantCulture,
                    DateTimeStyles.None,
                    out var parsedDate)) {
                    currentDate = DateTime.SpecifyKind(parsedDate, DateTimeKind.Utc);
                }
                continue;
            }

            var yesterdayMatch = YesterdayRegex().Match(trimmed);
            if (yesterdayMatch.Success) {
                var timeStr = yesterdayMatch.Groups["time"].Value;
                if (DateTime.TryParseExact(
                    timeStr,
                    "h:mm tt",
                    CultureInfo.InvariantCulture,
                    DateTimeStyles.None,
                    out var parsedTime)) {
                    var yesterday = DateTime.UtcNow.Date.AddDays(-1);
                    currentDate = new DateTime(
                        yesterday.Year, yesterday.Month, yesterday.Day,
                        parsedTime.Hour, parsedTime.Minute, 0,
                        DateTimeKind.Utc);
                }
                continue;
            }

            var darkTransform = DarkTransformRegex().Match(trimmed);
            if (darkTransform.Success) {
                var transformedType = darkTransform.Groups["transformedType"].Value;
                if (KakeraTypeMap.TryGetValue(transformedType, out var targetType)) {
                    darkTransformedTo = targetType;
                }
                continue;
            }

            var parsed = ParseLine(trimmed, darkTransformedTo, currentDate);
            if (parsed is not null) {
                if (darkTransformedTo.HasValue) {
                    darkTransformedTo = null;
                }
                yield return parsed;
            }
        }
    }

    private ParsedKakeraClaim? ParseLine(string line, KakeraType? darkTransformedTo, DateTime? currentDate) {
        var lightMatch = LightBreakdownRegex().Match(line);
        if (lightMatch.Success) {
            var valueStr = lightMatch.Groups["value"].Value.Replace(",", "");
            if (!int.TryParse(valueStr, out var value))
                return null;

            return new ParsedKakeraClaim(KakeraType.Light, value, currentDate);
        }

        var claimMatch = ClaimLineRegex().Match(line);
        if (!claimMatch.Success)
            return null;

        var typeSuffix = claimMatch.Groups["type"].Success ? claimMatch.Groups["type"].Value : "";
        if (!KakeraTypeMap.TryGetValue(typeSuffix, out var kakeraType))
            return null;

        if (darkTransformedTo.HasValue && kakeraType == darkTransformedTo.Value) {
            kakeraType = KakeraType.Dark;
        }

        var valueStr2 = claimMatch.Groups["value"].Value.Replace(",", "");
        if (!int.TryParse(valueStr2, out var value2))
            return null;

        return new ParsedKakeraClaim(kakeraType, value2, currentDate);
    }

    [GeneratedRegex(
        @"\d{1,2}/\d{1,2}/\d{4}\s+\d{1,2}:\d{2}\s+(?:AM|PM)",
        RegexOptions.IgnoreCase | RegexOptions.Compiled)]
    private static partial Regex DateLineRegex();

    [GeneratedRegex(
        @"\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}",
        RegexOptions.Compiled)]
    private static partial Regex IsoDateLineRegex();

    [GeneratedRegex(
        @"Yesterday\s+at\s+(?<time>\d{1,2}:\d{2}\s+(?:AM|PM))",
        RegexOptions.IgnoreCase | RegexOptions.Compiled)]
    private static partial Regex YesterdayRegex();

    [GeneratedRegex(
        @":kakeraL:breaks down into.*=>\s*\w+\s*\+\s*(?<value>[\d,]+)",
        RegexOptions.Compiled)]
    private static partial Regex LightBreakdownRegex();

    [GeneratedRegex(
        @":kakera(?<type>[A-Z]?)?:[^\+]+\+\s*(?<value>[\d,]+)",
        RegexOptions.Compiled)]
    private static partial Regex ClaimLineRegex();

    [GeneratedRegex(
        @":kakeraD:turns into:kakera(?<transformedType>[A-Z]?):",
        RegexOptions.Compiled)]
    private static partial Regex DarkTransformRegex();
}
