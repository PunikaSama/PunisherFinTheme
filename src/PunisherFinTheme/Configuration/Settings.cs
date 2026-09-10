using System.Text.RegularExpressions;
using MediaBrowser.Model.Plugins;

namespace PunisherFinTheme.Configuration;

public sealed partial class Settings : BasePluginConfiguration
{
    public bool Enabled { get; set; } = true;

    public string AccentColor { get; set; } = "#FF5F87";

    public bool ShowEpisodeOverview { get; set; } = true;

    public bool CompactEpisodes { get; set; }

    public bool StyleActionButtons { get; set; } = true;

    public bool StyleHome { get; set; } = true;

    public bool StyleLibraries { get; set; } = true;

    public void Sanitize()
    {
        string candidate = AccentColor?.Trim() ?? string.Empty;
        AccentColor = HexColorRegex().IsMatch(candidate)
            ? candidate.ToUpperInvariant()
            : "#FF5F87";
    }

    [GeneratedRegex("^#[0-9A-Fa-f]{6}$", RegexOptions.CultureInvariant)]
    private static partial Regex HexColorRegex();
}

