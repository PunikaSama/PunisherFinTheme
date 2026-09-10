using System.Text.Json.Serialization;

namespace PunisherFinTheme.Contracts;

public sealed class DependencyState
{
    [JsonPropertyName("connected")]
    public bool Connected { get; init; }

    [JsonPropertyName("message")]
    public required string Message { get; init; }

    [JsonPropertyName("version")]
    public required string Version { get; init; }
}
