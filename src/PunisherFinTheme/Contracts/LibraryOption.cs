using System.Text.Json.Serialization;

namespace PunisherFinTheme.Contracts;

public sealed class LibraryOption
{
    [JsonPropertyName("id")]
    public required string Id { get; init; }

    [JsonPropertyName("name")]
    public required string Name { get; init; }

    [JsonPropertyName("collectionType")]
    public string? CollectionType { get; init; }
}
