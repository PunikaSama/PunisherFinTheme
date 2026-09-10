using PunisherFinTheme.Configuration;

namespace PunisherFinTheme.Tests;

public sealed class SettingsTests
{
    [Fact]
    public void Defaults_EnablePlannedThemeAreas()
    {
        var settings = new Settings();

        Assert.True(settings.Enabled);
        Assert.Equal("#FF5F87", settings.AccentColor);
        Assert.True(settings.ShowEpisodeOverview);
        Assert.False(settings.CompactEpisodes);
        Assert.True(settings.StyleActionButtons);
        Assert.True(settings.StyleHome);
        Assert.True(settings.StyleLibraries);
    }

    [Theory]
    [InlineData("#ff5f87", "#FF5F87")]
    [InlineData(" #1aB2c3 ", "#1AB2C3")]
    [InlineData("red", "#FF5F87")]
    [InlineData("#123", "#FF5F87")]
    [InlineData("#12345678", "#FF5F87")]
    public void Sanitize_NormalizesOrRejectsAccentColor(string input, string expected)
    {
        var settings = new Settings { AccentColor = input };

        settings.Sanitize();

        Assert.Equal(expected, settings.AccentColor);
    }
}

