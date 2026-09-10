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

    [JsonPropertyName("version")]
    public required string Version { get; init; }
}
