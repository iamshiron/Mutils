using FluentAssertions;
using Mutils.Infrastructure.Services;
using Xunit;

namespace Mutils.Tests.Unit;

public class MudaeParserTests {
    private readonly MudaeParser _parser = new();

    [Fact]
    public void ParseCollection_WithValidData_ReturnsParsedCharacters() {
        var data = """
            #72 - Gawr Gura => 67 al, 118 img + 12 gif, 14 series · :bronzekey:   (1) 792 ka - https://mudae.net/uploads/test.png
            #117 - Itsuki Nakano => 4 al, 58 img + 3 gif, 5 series 647 ka - https://mudae.net/uploads/test2.png
            #144 - Hitori Gotou => 36 al, 54 img + 8 gif, 2 series 589 ka
            """;

        var result = _parser.ParseCollection(data).ToList();

        result.Should().HaveCount(3);
        result[0].Name.Should().Be("Gawr Gura");
        result[0].Rank.Should().Be(72);
        result[0].Kakera.Should().Be(792);
        result[0].KeyType.Should().Be("bronzekey");
        result[1].Name.Should().Be("Itsuki Nakano");
        result[1].Rank.Should().Be(117);
        result[2].Name.Should().Be("Hitori Gotou");
    }

    [Fact]
    public void ParseCollection_WithEmptyLines_SkipsThem() {
        var data = """
            #72 - Gawr Gura => 67 al, 118 img + 12 gif, 14 series 792 ka

            #117 - Itsuki Nakano => 4 al, 58 img + 3 gif, 5 series 647 ka
            
            """;

        var result = _parser.ParseCollection(data).ToList();

        result.Should().HaveCount(2);
    }

    [Fact]
    public void ParseCollection_WithKeyData_ParsesKeyInfo() {
        var data = "#497 - Keqing => 8 al, 49 img + 8 gif · :goldkey:   (8) 446 ka - https://mudae.net/uploads/test.png";

        var result = _parser.ParseCollection(data).ToList();

        result.Should().ContainSingle();
        result[0].Name.Should().Be("Keqing");
        result[0].KeyType.Should().Be("goldkey");
        result[0].KeyCount.Should().Be(8);
    }

    [Fact]
    public void ParseCollection_WithoutKeyData_ReturnsNullKey() {
        var data = "#333 - Kafka => 4 al, 33 img + 3 gif, 2 series 376 ka";

        var result = _parser.ParseCollection(data).ToList();

        result.Should().ContainSingle();
        result[0].KeyType.Should().BeNull();
        result[0].KeyCount.Should().BeNull();
    }

    [Fact]
    public void ParseCollection_WithEmptyData_ReturnsEmpty() {
        var result = _parser.ParseCollection("").ToList();
        result.Should().BeEmpty();
    }

    [Fact]
    public void ParseCollection_WithMinimalData_ParsesCorrectly() {
        var data = "#257 - Godzilla => 41 al, 124 img + 5 gif, 50 series 435 ka";

        var result = _parser.ParseCollection(data).ToList();

        result.Should().ContainSingle();
        result[0].Name.Should().Be("Godzilla");
        result[0].Rank.Should().Be(257);
        result[0].Claims.Should().Be(41);
        result[0].Images.Should().Be(124);
        result[0].Gifs.Should().Be(5);
        result[0].SeriesCount.Should().Be(50);
        result[0].Kakera.Should().Be(435);
    }

    [Fact]
    public void ParseCollection_WithCommaFormattedNumbers_ParsesCorrectly() {
        var data = """
            #2,092 - Skirk => 6 al, 29 img + 5 gif · :bronzekey:   (1) 125 ka - https://mudae.net/uploads/test.png
            #2,508 - Fu Xuan => 10 al, 24 img + 3 gif · :silverkey:   (3) 123 ka - https://mudae.net/uploads/test2.png
            """;

        var result = _parser.ParseCollection(data).ToList();

        result.Should().HaveCount(2);
        result[0].Name.Should().Be("Skirk");
        result[0].Rank.Should().Be(2092);
        result[0].Kakera.Should().Be(125);
        result[0].KeyType.Should().Be("bronzekey");
        result[1].Name.Should().Be("Fu Xuan");
        result[1].Rank.Should().Be(2508);
        result[1].KeyType.Should().Be("silverkey");
    }

    [Fact]
    public void ParseCollection_WithSpValue_ParsesCorrectly() {
        var data = "#4,765 - Chisa => 3 al, 40 img + 3 gif · :silverkey:   (3) 88 ka 600 sp - https://mudae.net/uploads/test.png";

        var result = _parser.ParseCollection(data).ToList();

        result.Should().ContainSingle();
        result[0].Name.Should().Be("Chisa");
        result[0].Rank.Should().Be(4765);
        result[0].Kakera.Should().Be(88);
        result[0].Sp.Should().Be(600);
        result[0].KeyType.Should().Be("silverkey");
        result[0].KeyCount.Should().Be(3);
        result[0].ImageUrl.Should().Be("https://mudae.net/uploads/test.png");
    }

    [Fact]
    public void ParseCollection_WithoutSeries_ParsesCorrectly() {
        var data = "#153 - Raiden Shogun => 29 al, 50 img + 8 gif 571 ka - https://mudae.net/uploads/test.png";

        var result = _parser.ParseCollection(data).ToList();

        result.Should().ContainSingle();
        result[0].Name.Should().Be("Raiden Shogun");
        result[0].SeriesCount.Should().BeNull();
        result[0].Kakera.Should().Be(571);
    }

    [Fact]
    public void ParseCollection_WithOnlyImagesNoGifs_ParsesCorrectly() {
        var data = "#261 - Monika => 5 al, 42 img  431 ka - https://mudae.net/uploads/test.png";

        var result = _parser.ParseCollection(data).ToList();

        result.Should().ContainSingle();
        result[0].Name.Should().Be("Monika");
        result[0].Images.Should().Be(42);
        result[0].Gifs.Should().BeNull();
        result[0].SeriesCount.Should().BeNull();
    }

    [Fact]
    public void ParseCollection_WithZeroClaims_ParsesCorrectly() {
        var data = "#1,640 - Pucca => 0 al, 4 img + 1 gif 144 ka - https://mudae.net/uploads/test.png";

        var result = _parser.ParseCollection(data).ToList();

        result.Should().ContainSingle();
        result[0].Name.Should().Be("Pucca");
        result[0].Claims.Should().Be(0);
        result[0].Images.Should().Be(4);
        result[0].Gifs.Should().Be(1);
    }

    [Fact]
    public void ParseCollection_WithParenthesesInName_ParsesCorrectly() {
        var data = "#1,206 - Robin (HSR) => 11 al, 53 img + 9 gif 173 ka - https://mudae.net/uploads/test.png";

        var result = _parser.ParseCollection(data).ToList();

        result.Should().ContainSingle();
        result[0].Name.Should().Be("Robin (HSR)");
    }

    [Fact]
    public void ParseCollection_WithHighRank_ParsesCorrectly() {
        var data = "#10,278 - Zarya => 10 al, 27 img , 4 series 56 ka - https://mudae.net/uploads/test.png";

        var result = _parser.ParseCollection(data).ToList();

        result.Should().ContainSingle();
        result[0].Name.Should().Be("Zarya");
        result[0].Rank.Should().Be(10278);
    }

    [Fact]
    public void ParseCollection_WithNoKeyButWithSeries_ParsesCorrectly() {
        var data = "#184 - Ishtar => 15 al, 42 img + 5 gif, 3 series 520 ka - https://mudae.net/uploads/test.png";

        var result = _parser.ParseCollection(data).ToList();

        result.Should().ContainSingle();
        result[0].Name.Should().Be("Ishtar");
        result[0].SeriesCount.Should().Be(3);
        result[0].KeyType.Should().BeNull();
    }

    [Fact]
    public void ParseCollection_WithBronzeKeyAndSp_ParsesCorrectly() {
        var data = "#2,082 - Kiriko => 9 al, 74 img + 3 gif, 4 series · :bronzekey:   (1) 125 ka - https://mudae.net/uploads/test.png";

        var result = _parser.ParseCollection(data).ToList();

        result.Should().ContainSingle();
        result[0].Name.Should().Be("Kiriko");
        result[0].KeyType.Should().Be("bronzekey");
        result[0].KeyCount.Should().Be(1);
        result[0].SeriesCount.Should().Be(4);
    }

    [Fact]
    public void ParseCollection_WithSilverKey_ParsesCorrectly() {
        var data = "#377 - Mizuki Akiyama => 4 al, 119 img + 5 gif, 2 series · :silverkey:   (3) 384 ka - https://mudae.net/uploads/test.png";

        var result = _parser.ParseCollection(data).ToList();

        result.Should().ContainSingle();
        result[0].Name.Should().Be("Mizuki Akiyama");
        result[0].KeyType.Should().Be("silverkey");
        result[0].KeyCount.Should().Be(3);
    }

    [Fact]
    public void ParseCollection_WithNoImagesField_ParsesCorrectly() {
        var data = "#1,200 - Fami => 11 al, 3 img  173 ka - https://mudae.net/uploads/test.png";

        var result = _parser.ParseCollection(data).ToList();

        result.Should().ContainSingle();
        result[0].Name.Should().Be("Fami");
        result[0].Claims.Should().Be(11);
        result[0].Images.Should().Be(3);
        result[0].Gifs.Should().BeNull();
    }

    [Fact]
    public void ParseCollection_WithGoldKey_ParsesCorrectly() {
        var data = "#2,854 - Sandrone => 4 al, 18 img + 1 gif · :goldkey:   (7) 146 ka - https://mudae.net/uploads/test.png";

        var result = _parser.ParseCollection(data).ToList();

        result.Should().ContainSingle();
        result[0].Name.Should().Be("Sandrone");
        result[0].KeyType.Should().Be("goldkey");
        result[0].KeyCount.Should().Be(7);
    }

    [Fact]
    public void ParseCollection_WithVeryHighRank_ParsesCorrectly() {
        var data = "#85,224 - Chinami Komuro => 1 al, 9 img  · :bronzekey:   (2) 35 ka - https://mudae.net/uploads/test.png";

        var result = _parser.ParseCollection(data).ToList();

        result.Should().ContainSingle();
        result[0].Name.Should().Be("Chinami Komuro");
        result[0].Rank.Should().Be(85224);
    }

    [Fact]
    public void ParseCollection_WithCommaInKakera_ParsesCorrectly() {
        var data = "#1,024 - Chise Hatori => 5 al, 63 img + 4 gif, 2 series · :bronzekey:   (1) 191 ka - https://mudae.net/uploads/test.png";

        var result = _parser.ParseCollection(data).ToList();

        result.Should().ContainSingle();
        result[0].Name.Should().Be("Chise Hatori");
        result[0].Rank.Should().Be(1024);
        result[0].Kakera.Should().Be(191);
    }

    [Fact]
    public void ParseCollection_WithSpecialCharactersInName_ParsesCorrectly() {
        var data = "#2,082 - Kiriko => 9 al, 74 img + 3 gif, 4 series · :bronzekey:   (1) 125 ka - https://mudae.net/uploads/4098338/xCgtuec~IiKGPud.png";

        var result = _parser.ParseCollection(data).ToList();

        result.Should().ContainSingle();
        result[0].Name.Should().Be("Kiriko");
        result[0].ImageUrl.Should().Contain("xCgtuec~IiKGPud.png");
    }

    [Fact]
    public void ParseCollection_WithFullTestData_ParsesAllLines() {
        var dataPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Data", "collection-sample.txt");
        var data = File.ReadAllText(dataPath);
        var lines = File.ReadAllLines(dataPath).Count(l => !string.IsNullOrWhiteSpace(l));

        var result = _parser.ParseCollection(data).ToList();

        result.Should().HaveCount(lines, $"because there are {lines} non-empty lines in the test file");
    }
}
