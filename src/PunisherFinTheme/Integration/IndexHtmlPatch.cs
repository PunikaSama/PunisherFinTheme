using System.Text.Json.Serialization;
using MediaBrowser.Common.Net;

namespace PunisherFinTheme.Integration;

public static class IndexHtmlPatch
{
    private const string ElementId = "punisherfin-theme-client-loader";

    public static string Apply(HtmlDocumentInput input)
    {
        string html = input.Contents ?? string.Empty;
        if (html.Length == 0 || html.Contains(ElementId, StringComparison.OrdinalIgnoreCase))
        {
            return html;
        }

        int insertionPoint = html.LastIndexOf("</body>", StringComparison.OrdinalIgnoreCase);
        if (insertionPoint < 0)
        {
            return html;
        }

        string baseUrl = Plugin.Current?.ServerConfiguration.GetNetworkConfiguration().BaseUrl?.Trim() ?? string.Empty;
        string prefix = string.IsNullOrEmpty(baseUrl) ? string.Empty : $"/{baseUrl.Trim('/')}";
        string version = typeof(IndexHtmlPatch).Assembly.GetName().Version?.ToString() ?? "0";
        string loader = $"<script id=\"{ElementId}\" defer src=\"{prefix}/PunisherFinTheme/web?v={Uri.EscapeDataString(version)}\"></script>";
        return html.Insert(insertionPoint, loader);
    }
}

public sealed class HtmlDocumentInput
{
    [JsonPropertyName("contents")]
    public string? Contents { get; init; }
}
