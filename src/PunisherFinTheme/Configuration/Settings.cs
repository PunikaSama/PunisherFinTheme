using System.Text.RegularExpressions;
using MediaBrowser.Model.Plugins;
using PunisherFinTheme.Contracts;

namespace PunisherFinTheme.Configuration;

public sealed partial class Settings : BasePluginConfiguration
{
    public bool Enabled { get; set; } = true;

    public string AccentColor { get; set; } = "#FF5F87";

    public string DesignPreset { get; set; } = ThemeDesignCatalog.DefaultId;

    public bool EnablePunisherFinBranding { get; set; } = true;

    public bool ShowEpisodeOverview { get; set; } = true;

    public bool CompactEpisodes { get; set; }

    public bool StyleActionButtons { get; set; } = true;

    public bool StyleHome { get; set; } = true;

    public bool StyleLibraries { get; set; } = true;

    public bool EnableCardPreviews { get; set; } = true;

    public bool EnableVideoPreviews { get; set; } = true;

    public bool StylePlayerControls { get; set; } = true;

    public bool EnableRandomBackground { get; set; } = true;

    public string BackgroundLibraryId { get; set; } = string.Empty;

    public string BackgroundLibraryName { get; set; } = "Anime";

    public int BackgroundChangeIntervalSeconds { get; set; } = 30;

    public int BackgroundOpacityPercent { get; set; } = 100;

    public int BackgroundBrightnessPercent { get; set; } = 68;

    public int BackgroundBlurPixels { get; set; } = 5;

    public int BackgroundSaturationPercent { get; set; } = 110;

    public int BackgroundContrastPercent { get; set; } = 105;

    public int BackgroundOverlayPercent { get; set; } = 22;

    public int BackgroundCrossfadeMilliseconds { get; set; } = 2500;

    public int BackgroundImageQuality { get; set; } = 90;

    public void Sanitize()
    {
        string candidate = AccentColor?.Trim() ?? string.Empty;
        AccentColor = HexColorRegex().IsMatch(candidate)
            ? candidate.ToUpperInvariant()
            : "#FF5F87";
        DesignPreset = ThemeDesignCatalog.Normalize(DesignPreset);

        BackgroundLibraryId = Guid.TryParse(BackgroundLibraryId, out Guid libraryId)
            ? libraryId.ToString("D")
            : string.Empty;
        BackgroundLibraryName = string.IsNullOrWhiteSpace(BackgroundLibraryName)
            ? "Anime"
            : BackgroundLibraryName.Trim();
        BackgroundChangeIntervalSeconds = Math.Clamp(BackgroundChangeIntervalSeconds, 10, 3600);
        BackgroundOpacityPercent = Math.Clamp(BackgroundOpacityPercent, 0, 100);
        BackgroundBrightnessPercent = Math.Clamp(BackgroundBrightnessPercent, 20, 150);
        BackgroundBlurPixels = Math.Clamp(BackgroundBlurPixels, 0, 30);
        BackgroundSaturationPercent = Math.Clamp(BackgroundSaturationPercent, 0, 200);
        BackgroundContrastPercent = Math.Clamp(BackgroundContrastPercent, 50, 200);
        BackgroundOverlayPercent = Math.Clamp(BackgroundOverlayPercent, 0, 80);
        BackgroundCrossfadeMilliseconds = Math.Clamp(BackgroundCrossfadeMilliseconds, 0, 10000);
        BackgroundImageQuality = Math.Clamp(BackgroundImageQuality, 30, 100);
    }

    [GeneratedRegex("^#[0-9A-Fa-f]{6}$", RegexOptions.CultureInvariant)]
    private static partial Regex HexColorRegex();
}
