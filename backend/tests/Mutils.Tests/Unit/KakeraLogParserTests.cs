using FluentAssertions;
using Mutils.Core.Entities;
using Mutils.Infrastructure.Services;
using Xunit;

namespace Mutils.Tests.Unit;

public class KakeraLogParserTests {
    private readonly KakeraLogParser _parser = new();

    [Fact]
    public void ParseKakeraLog_WithBlueKakera_ParsesCorrectly() {
        var data = ":kakera:iamshiron +121 ($k)";

        var result = _parser.ParseKakeraLog(data).ToList();

        result.Should().ContainSingle();
        result[0].Type.Should().Be(KakeraType.Blue);
        result[0].Value.Should().Be(121);
    }

    [Fact]
    public void ParseKakeraLog_WithPurpleKakera_ParsesCorrectly() {
        var data = ":kakeraP:iamshiron +110 ($k)";

        var result = _parser.ParseKakeraLog(data).ToList();

        result.Should().ContainSingle();
        result[0].Type.Should().Be(KakeraType.Purple);
        result[0].Value.Should().Be(110);
    }

    [Fact]
    public void ParseKakeraLog_WithTealKakera_ParsesCorrectly() {
        var data = ":kakeraT:iamshiron +241 ($k)";

        var result = _parser.ParseKakeraLog(data).ToList();

        result.Should().ContainSingle();
        result[0].Type.Should().Be(KakeraType.Teal);
        result[0].Value.Should().Be(241);
    }

    [Fact]
    public void ParseKakeraLog_WithGreenKakera_ParsesCorrectly() {
        var data = ":kakeraG:iamshiron +283 ($k)";

        var result = _parser.ParseKakeraLog(data).ToList();

        result.Should().ContainSingle();
        result[0].Type.Should().Be(KakeraType.Green);
        result[0].Value.Should().Be(283);
    }

    [Fact]
    public void ParseKakeraLog_WithYellowKakera_ParsesCorrectly() {
        var data = ":kakeraY:iamshiron +458 ($k)";

        var result = _parser.ParseKakeraLog(data).ToList();

        result.Should().ContainSingle();
        result[0].Type.Should().Be(KakeraType.Yellow);
        result[0].Value.Should().Be(458);
    }

    [Fact]
    public void ParseKakeraLog_WithOrangeKakera_ParsesCorrectly() {
        var data = ":kakeraO:iamshiron +776 ($k)";

        var result = _parser.ParseKakeraLog(data).ToList();

        result.Should().ContainSingle();
        result[0].Type.Should().Be(KakeraType.Orange);
        result[0].Value.Should().Be(776);
    }

    [Fact]
    public void ParseKakeraLog_WithRedKakera_ParsesCorrectly() {
        var data = ":kakeraR:iamshiron +1,616 ($k)";

        var result = _parser.ParseKakeraLog(data).ToList();

        result.Should().ContainSingle();
        result[0].Type.Should().Be(KakeraType.Red);
        result[0].Value.Should().Be(1616);
    }

    [Fact]
    public void ParseKakeraLog_WithRainbowKakera_ParsesCorrectly() {
        var data = ":kakeraW:iamshiron +3,387 ($k)";

        var result = _parser.ParseKakeraLog(data).ToList();

        result.Should().ContainSingle();
        result[0].Type.Should().Be(KakeraType.Rainbow);
        result[0].Value.Should().Be(3387);
    }

    [Fact]
    public void ParseKakeraLog_WithLightKakera_ParsesCorrectly() {
        var data = ":kakeraL:breaks down into:kakera:+:kakera:+:kakeraG:+:kakera: => iamshiron +760 ($k)";

        var result = _parser.ParseKakeraLog(data).ToList();

        result.Should().ContainSingle();
        result[0].Type.Should().Be(KakeraType.Light);
        result[0].Value.Should().Be(760);
    }

    [Fact]
    public void ParseKakeraLog_WithChaosKakera_ParsesCorrectly() {
        var data = ":kakeraC:iamshiron +880 ($k)";

        var result = _parser.ParseKakeraLog(data).ToList();

        result.Should().ContainSingle();
        result[0].Type.Should().Be(KakeraType.Chaos);
        result[0].Value.Should().Be(880);
    }

    [Fact]
    public void ParseKakeraLog_WithDarkTransformingToOrange_ParsesAsDark() {
        var data = """
            :kakeraD:turns into:kakeraO:
            :kakeraO:iamshiron +800 ($k)
            """;

        var result = _parser.ParseKakeraLog(data).ToList();

        result.Should().ContainSingle();
        result[0].Type.Should().Be(KakeraType.Dark);
        result[0].Value.Should().Be(800);
    }

    [Fact]
    public void ParseKakeraLog_WithDarkTransformingToPurple_ParsesAsDark() {
        var data = """
            :kakeraD:turns into:kakeraP:
            :kakeraP:(Free) iamshiron +110 ($k)
            """;

        var result = _parser.ParseKakeraLog(data).ToList();

        result.Should().ContainSingle();
        result[0].Type.Should().Be(KakeraType.Dark);
        result[0].Value.Should().Be(110);
    }

    [Fact]
    public void ParseKakeraLog_WithMultipleLines_ParsesAll() {
        var data = """
            :kakera:iamshiron +121 ($k)
            :kakeraT:iamshiron +241 ($k)
            :kakeraG:iamshiron +283 ($k)
            """;

        var result = _parser.ParseKakeraLog(data).ToList();

        result.Should().HaveCount(3);
        result[0].Type.Should().Be(KakeraType.Blue);
        result[0].Value.Should().Be(121);
        result[1].Type.Should().Be(KakeraType.Teal);
        result[1].Value.Should().Be(241);
        result[2].Type.Should().Be(KakeraType.Green);
        result[2].Value.Should().Be(283);
    }

    [Fact]
    public void ParseKakeraLog_WithCommaFormattedValue_ParsesCorrectly() {
        var data = ":kakeraR:iamshiron +1,616 ($k)";

        var result = _parser.ParseKakeraLog(data).ToList();

        result.Should().ContainSingle();
        result[0].Value.Should().Be(1616);
    }

    [Fact]
    public void ParseKakeraLog_WithFreePrefix_ParsesCorrectly() {
        var data = ":kakeraP:(Free) iamshiron +110 ($k)";

        var result = _parser.ParseKakeraLog(data).ToList();

        result.Should().ContainSingle();
        result[0].Type.Should().Be(KakeraType.Purple);
        result[0].Value.Should().Be(110);
    }

    [Fact]
    public void ParseKakeraLog_WithInvalidLine_SkipsLine() {
        var data = """
            :rollstack:
            :kakera:iamshiron +121 ($k)
            :kakeraC:+30 :sp:
            """;

        var result = _parser.ParseKakeraLog(data).ToList();

        result.Should().ContainSingle();
        result[0].Type.Should().Be(KakeraType.Blue);
        result[0].Value.Should().Be(121);
    }

    [Fact]
    public void ParseKakeraLog_WithEmptyData_ReturnsEmpty() {
        var result = _parser.ParseKakeraLog("").ToList();
        result.Should().BeEmpty();
    }

    [Fact]
    public void ParseKakeraLog_WithRealWorldData_ParsesCorrectly() {
        var data = """
            Logan Yarborough
            APP
             — 10/22/2025 7:06 PM
            :kakera:iamshiron +121 ($k)
            Logan Yarborough
            APP
             — 10/22/2025 12:28 PM
            :kakera:iamshiron +142 ($k)
            Logan Yarborough
            APP
             — 10/19/2025 6:46 PM
            :kakera:iamshiron +147 ($k)
            """;

        var result = _parser.ParseKakeraLog(data).ToList();

        result.Should().HaveCount(3);
        result.Should().AllSatisfy(c => c.Type.Should().Be(KakeraType.Blue));
        result[0].Value.Should().Be(121);
        result[1].Value.Should().Be(142);
        result[2].Value.Should().Be(147);
    }

    [Fact]
    public void ParseKakeraLog_WithLightBreakdown_ParsesAsLight() {
        var data = ":kakeraL:breaks down into:kakeraP:+:kakera:+:kakeraT:+:kakeraP: => iamshiron +606 ($k)";

        var result = _parser.ParseKakeraLog(data).ToList();

        result.Should().ContainSingle();
        result[0].Type.Should().Be(KakeraType.Light);
        result[0].Value.Should().Be(606);
    }

    [Fact]
    public void ParseKakeraLog_WithDateOnPreviousLine_ParsesDateCorrectly() {
        var data = """
            Logan Yarborough
            APP
             — 10/22/2025 7:06 PM
            :kakera:iamshiron +121 ($k)
            """;

        var result = _parser.ParseKakeraLog(data).ToList();

        result.Should().ContainSingle();
        result[0].Type.Should().Be(KakeraType.Blue);
        result[0].Value.Should().Be(121);
        result[0].ClaimedAt.Should().NotBeNull();
        var claimedAt = result[0].ClaimedAt!.Value;
        claimedAt.Month.Should().Be(10);
        claimedAt.Day.Should().Be(22);
        claimedAt.Year.Should().Be(2025);
        claimedAt.Hour.Should().Be(19);
        claimedAt.Minute.Should().Be(6);
    }

    [Fact]
    public void ParseKakeraLog_WithYesterdayFormat_ParsesDateCorrectly() {
        var data = """
            Logan Yarborough
            APP
             — Yesterday at 12:04 PM
            :kakeraL:breaks down into:kakeraP:+:kakera:+:kakeraT:+:kakeraP: => iamshiron +606 ($k)
            """;

        var result = _parser.ParseKakeraLog(data).ToList();

        result.Should().ContainSingle();
        result[0].Type.Should().Be(KakeraType.Light);
        result[0].Value.Should().Be(606);
        result[0].ClaimedAt.Should().NotBeNull();
        var yesterday = DateTime.Today.AddDays(-1);
        var claimedAt = result[0].ClaimedAt!.Value;
        claimedAt.Year.Should().Be(yesterday.Year);
        claimedAt.Month.Should().Be(yesterday.Month);
        claimedAt.Day.Should().Be(yesterday.Day);
        claimedAt.Hour.Should().Be(12);
        claimedAt.Minute.Should().Be(4);
    }

    [Fact]
    public void ParseKakeraLog_WithMultipleDates_TracksDatePerClaim() {
        var data = """
             — 10/22/2025 7:06 PM
            :kakera:iamshiron +121 ($k)
             — 10/21/2025 3:30 PM
            :kakeraT:iamshiron +241 ($k)
            """;

        var result = _parser.ParseKakeraLog(data).ToList();

        result.Should().HaveCount(2);
        result[0].ClaimedAt!.Value.Day.Should().Be(22);
        result[1].ClaimedAt!.Value.Day.Should().Be(21);
    }

    [Fact]
    public void ParseKakeraLog_WithIsoDateFormat_ParsesDateCorrectly() {
        var data = """
             — 2025-10-11 19:08
            :kakera:iamshiron +163 ($k)
            Logan Yarborough
            APP
             — 2025-10-09 16:41
            :kakeraT:iamshiron +218 ($k)
            """;

        var result = _parser.ParseKakeraLog(data).ToList();

        result.Should().HaveCount(2);
        result[0].Type.Should().Be(KakeraType.Blue);
        result[0].Value.Should().Be(163);
        result[0].ClaimedAt.Should().NotBeNull();
        result[0].ClaimedAt!.Value.Year.Should().Be(2025);
        result[0].ClaimedAt!.Value.Month.Should().Be(10);
        result[0].ClaimedAt!.Value.Day.Should().Be(11);
        result[0].ClaimedAt!.Value.Hour.Should().Be(19);
        result[0].ClaimedAt!.Value.Minute.Should().Be(8);
        
        result[1].Type.Should().Be(KakeraType.Teal);
        result[1].Value.Should().Be(218);
        result[1].ClaimedAt.Should().NotBeNull();
        result[1].ClaimedAt!.Value.Year.Should().Be(2025);
        result[1].ClaimedAt!.Value.Month.Should().Be(10);
        result[1].ClaimedAt!.Value.Day.Should().Be(9);
        result[1].ClaimedAt!.Value.Hour.Should().Be(16);
        result[1].ClaimedAt!.Value.Minute.Should().Be(41);
    }
}
