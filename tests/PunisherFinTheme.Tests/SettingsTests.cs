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
        Assert.True(settings.EnableCardPreviews);
        Assert.True(settings.StylePlayerControls);
        Assert.True(settings.EnableRandomBackground);
        Assert.Equal("Anime", settings.BackgroundLibraryName);
        Assert.Equal(30, settings.BackgroundChangeIntervalSeconds);
        Assert.Equal(100, settings.BackgroundOpacityPercent);
        Assert.Equal(68, settings.BackgroundBrightnessPercent);
        Assert.Equal(5, settings.BackgroundBlurPixels);
        Assert.Equal(110, settings.BackgroundSaturationPercent);
        Assert.Equal(105, settings.BackgroundContrastPercent);
        Assert.Equal(22, settings.BackgroundOverlayPercent);
        Assert.Equal(2500, settings.BackgroundCrossfadeMilliseconds);
        Assert.Equal(90, settings.BackgroundImageQuality);
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

    [Fact]
    public void Sanitize_NormalizesBackgroundSettings()
    {
        var settings = new Settings
        {
            BackgroundLibraryId = "not-a-guid",
            BackgroundLibraryName = " ",
            BackgroundChangeIntervalSeconds = 1,
            BackgroundOpacityPercent = 200,
            BackgroundBrightnessPercent = 1,
            BackgroundBlurPixels = 99,
            BackgroundSaturationPercent = -1,
            BackgroundContrastPercent = 500,
            BackgroundOverlayPercent = 99,
            BackgroundCrossfadeMilliseconds = -10,
            BackgroundImageQuality = 1
        };

        settings.Sanitize();

        Assert.Equal(string.Empty, settings.BackgroundLibraryId);
        Assert.Equal("Anime", settings.BackgroundLibraryName);
        Assert.Equal(10, settings.BackgroundChangeIntervalSeconds);
        Assert.Equal(100, settings.BackgroundOpacityPercent);
        Assert.Equal(20, settings.BackgroundBrightnessPercent);
        Assert.Equal(30, settings.BackgroundBlurPixels);
        Assert.Equal(0, settings.BackgroundSaturationPercent);
        Assert.Equal(200, settings.BackgroundContrastPercent);
        Assert.Equal(80, settings.BackgroundOverlayPercent);
        Assert.Equal(0, settings.BackgroundCrossfadeMilliseconds);
        Assert.Equal(30, settings.BackgroundImageQuality);
    }
}
