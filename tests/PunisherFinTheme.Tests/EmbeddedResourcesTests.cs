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
        Assert.Contains("PunisherFinTheme.Web.punisherfin-theme.js", resources);
    }
}

