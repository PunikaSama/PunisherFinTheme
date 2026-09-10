using System.Text.Json.Serialization;

namespace PunisherFinTheme.Contracts;

public sealed class ClientThemeConfig
{
    [JsonPropertyName("enabled")]
    public bool Enabled { get; init; }

    [JsonPropertyName("accent")]
    public required string Accent { get; init; }

    [JsonPropertyName("episodeOverview")]
    public bool EpisodeOverview { get; init; }

    [JsonPropertyName("compactEpisodes")]
    public bool CompactEpisodes { get; init; }

    [JsonPropertyName("actionButtons")]
    public bool ActionButtons { get; init; }

    [JsonPropertyName("home")]
    public bool Home { get; init; }

    [JsonPropertyName("libraries")]
    public bool Libraries { get; init; }

    [JsonPropertyName("cardPreviews")]
    public bool CardPreviews { get; init; }

    [JsonPropertyName("playerControls")]
    public bool PlayerControls { get; init; }

    [JsonPropertyName("randomBackground")]
    public bool RandomBackground { get; init; }

    [JsonPropertyName("backgroundLibraryId")]
    public required string BackgroundLibraryId { get; init; }

    [JsonPropertyName("backgroundLibraryName")]
    public required string BackgroundLibraryName { get; init; }

    [JsonPropertyName("backgroundInterval")]
    public int BackgroundInterval { get; init; }

    [JsonPropertyName("backgroundOpacity")]
    public int BackgroundOpacity { get; init; }

    [JsonPropertyName("backgroundBrightness")]
    public int BackgroundBrightness { get; init; }

    [JsonPropertyName("backgroundBlur")]
    public int BackgroundBlur { get; init; }

    [JsonPropertyName("backgroundSaturation")]
    public int BackgroundSaturation { get; init; }

    [JsonPropertyName("backgroundContrast")]
    public int BackgroundContrast { get; init; }

    [JsonPropertyName("backgroundOverlay")]
    public int BackgroundOverlay { get; init; }

    [JsonPropertyName("backgroundCrossfade")]
    public int BackgroundCrossfade { get; init; }

    [JsonPropertyName("backgroundQuality")]
    public int BackgroundQuality { get; init; }

    [JsonPropertyName("version")]
    public required string Version { get; init; }
}
