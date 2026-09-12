using System.Text.Json.Serialization;

namespace PunisherFinTheme.Contracts;

public sealed class DesignOption
{
    [JsonPropertyName("id")]
    public required string Id { get; init; }

    [JsonPropertyName("name")]
    public required string Name { get; init; }

    [JsonPropertyName("description")]
    public required string Description { get; init; }

    [JsonPropertyName("isDefault")]
    public bool IsDefault { get; init; }

    [JsonPropertyName("stylesheet")]
    public required string Stylesheet { get; init; }
}

public static class ThemeDesignCatalog
{
    public const string DefaultId = "punisherfin";
    public const string CinematicId = "cinematic";

    public static IReadOnlyList<DesignOption> All { get; } =
    [
        new DesignOption
        {
            Id = DefaultId,
            Name = "PunisherFin",
            Description = "Das bisherige PunisherFinTheme-Design. Unverändert und weiterhin Standard.",
            IsDefault = true,
            Stylesheet = "/PunisherFinTheme/styles.css"
        },
        new DesignOption
        {
            Id = CinematicId,
            Name = "Cinematic",
            Description = "Breite Medienkarten, filmische Verläufe und eine eigenständige Oberfläche.",
            Stylesheet = "/PunisherFinTheme/designs/cinematic.css"
        }
    ];

    public static string Normalize(string? id)
    {
        return string.Equals(id?.Trim(), CinematicId, StringComparison.OrdinalIgnoreCase)
            ? CinematicId
            : DefaultId;
    }

    public static bool IsKnown(string? id)
    {
        return string.Equals(id, DefaultId, StringComparison.Ordinal)
            || string.Equals(id, CinematicId, StringComparison.Ordinal);
    }
}
