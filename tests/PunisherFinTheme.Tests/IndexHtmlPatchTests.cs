using Newtonsoft.Json.Linq;
using PunisherFinTheme.Integration;

namespace PunisherFinTheme.Tests;

public sealed class IndexHtmlPatchTests
{
    [Fact]
    public void FileTransformationPayload_DeserializesAndAppliesPatch()
    {
        var payload = new JObject { ["contents"] = "<html><body></body></html>" };

        HtmlDocumentInput? input = payload.ToObject<HtmlDocumentInput>();

        Assert.NotNull(input);
        Assert.Contains("punisherfin-theme-client-loader", IndexHtmlPatch.Apply(input), StringComparison.Ordinal);
    }

    [Fact]
    public void Apply_AddsOneVersionedLoaderBeforeBodyEnd()
    {
        const string source = "<html><body><main></main></body></html>";

        string transformed = IndexHtmlPatch.Apply(new HtmlDocumentInput { Contents = source });

        Assert.Contains("id=\"punisherfin-theme-client-loader\"", transformed, StringComparison.Ordinal);
        Assert.Contains("src=\"/PunisherFinTheme/web?v=", transformed, StringComparison.Ordinal);
        Assert.True(
            transformed.IndexOf("punisherfin-theme-client-loader", StringComparison.Ordinal)
            < transformed.IndexOf("</body>", StringComparison.Ordinal));
    }

    [Fact]
    public void Apply_DoesNotDuplicateExistingLoader()
    {
        const string source = "<body><script id=\"punisherfin-theme-client-loader\"></script></body>";

        string transformed = IndexHtmlPatch.Apply(new HtmlDocumentInput { Contents = source });

        Assert.Equal(source, transformed);
    }

    [Theory]
    [InlineData("")]
    [InlineData("<html></html>")]
    public void Apply_LeavesUnsupportedDocumentsUntouched(string source)
    {
        string transformed = IndexHtmlPatch.Apply(new HtmlDocumentInput { Contents = source });

        Assert.Equal(source, transformed);
    }
}

