using System.Reflection;

namespace PunisherFinTheme.Tests;

public sealed class EmbeddedResourcesTests
{
    [Fact]
    public void AssemblyContainsSettingsStylesAndClientScript()
    {
        Assembly assembly = typeof(Plugin).Assembly;
        string[] resources = assembly.GetManifestResourceNames();

        Assert.Contains("PunisherFinTheme.Configuration.settings.html", resources);
        Assert.Contains("PunisherFinTheme.Web.punisherfin-theme.css", resources);
        Assert.Contains("PunisherFinTheme.Web.Designs.cinematic-theme.css", resources);
        Assert.Contains("PunisherFinTheme.Web.settings-design.css", resources);
        Assert.Contains("PunisherFinTheme.Web.punisherfin-theme.js", resources);
        Assert.Contains("PunisherFinTheme.Web.punisherfin-logo.png", resources);
    }

    [Fact]
    public void EmbeddedSettingsPageLoadsConfigurationIndependently()
    {
        Assembly assembly = typeof(Plugin).Assembly;
        using Stream stream = assembly.GetManifestResourceStream("PunisherFinTheme.Configuration.settings.html")!;
        using var reader = new StreamReader(stream);
        string html = reader.ReadToEnd();

        Assert.Contains("function applySettings(settings)", html, StringComparison.Ordinal);
        Assert.Contains("function loadOptionalInformation(settings)", html, StringComparison.Ordinal);
        Assert.Contains("ranges.forEach(bindRange)", html, StringComparison.Ordinal);
        Assert.DoesNotContain("Promise.all", html, StringComparison.Ordinal);
        Assert.DoesNotContain("AbortController", html, StringComparison.Ordinal);
    }
}
