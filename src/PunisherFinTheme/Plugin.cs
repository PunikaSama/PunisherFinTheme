using System.Globalization;
using MediaBrowser.Common.Configuration;
using MediaBrowser.Common.Plugins;
using MediaBrowser.Controller.Configuration;
using MediaBrowser.Model.Plugins;
using MediaBrowser.Model.Serialization;
using PunisherFinTheme.Configuration;

namespace PunisherFinTheme;

public sealed class Plugin : BasePlugin<Settings>, IHasWebPages
{
    public static readonly Guid PluginGuid = Guid.Parse("4763374d-d1ce-4404-b769-3625dacdcb84");

    public Plugin(
        IApplicationPaths applicationPaths,
        IXmlSerializer xmlSerializer,
        IServerConfigurationManager serverConfigurationManager)
        : base(applicationPaths, xmlSerializer)
    {
        Current = this;
        ServerConfiguration = serverConfigurationManager;
        Configuration.Sanitize();
    }

    public static Plugin? Current { get; private set; }

    public IServerConfigurationManager ServerConfiguration { get; }

    public override Guid Id => PluginGuid;

    public override string Name => "PunisherFinTheme";

    public override string Description => "PunisherFin-inspiriertes Design für Jellyfin Web.";

    public override void UpdateConfiguration(BasePluginConfiguration configuration)
    {
        if (configuration is Settings settings)
        {
            settings.Sanitize();
        }

        base.UpdateConfiguration(configuration);
    }

    public IEnumerable<PluginPageInfo> GetPages()
    {
        yield return new PluginPageInfo
        {
            Name = Name,
            EmbeddedResourcePath = string.Format(
                CultureInfo.InvariantCulture,
                "{0}.Configuration.settings.html",
                GetType().Namespace)
        };
    }
}

