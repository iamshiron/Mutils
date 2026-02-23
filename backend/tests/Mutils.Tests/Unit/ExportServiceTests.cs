using FluentAssertions;
using Mutils.Infrastructure.Services;
using Xunit;

namespace Mutils.Tests.Unit;

public class ExportServiceTests {
    private readonly ExportService _service = new();

    [Fact]
    public void ExportToCommaSeparated_ReturnsCommaSeparatedString() {
        var characters = new[] { "Char1", "Char2", "Char3" };

        var result = _service.ExportToCommaSeparated(characters);

        result.Should().Be("Char1, Char2, Char3");
    }

    [Fact]
    public void ExportToNewlineSeparated_ReturnsNewlineSeparatedString() {
        var characters = new[] { "Char1", "Char2", "Char3" };

        var result = _service.ExportToNewlineSeparated(characters);

        result.Should().Be("Char1\nChar2\nChar3");
    }

    [Fact]
    public void ExportToMudaeFormat_ReturnsCommaSeparatedString() {
        var characters = new[] { "Char1", "Char2" };

        var result = _service.ExportToMudaeFormat(characters);

        result.Should().Be("Char1, Char2");
    }

    [Fact]
    public void Export_WithEmptyCollection_ReturnsEmptyString() {
        var result = _service.ExportToCommaSeparated(Array.Empty<string>());
        result.Should().BeEmpty();
    }

    [Fact]
    public void Export_TrimsWhitespaceFromNames() {
        var characters = new[] { "  Char1  ", " Char2 " };

        var result = _service.ExportToCommaSeparated(characters);

        result.Should().Be("Char1, Char2");
    }
}
