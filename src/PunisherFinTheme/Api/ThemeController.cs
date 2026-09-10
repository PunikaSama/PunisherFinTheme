using System.Net.Mime;
using System.Reflection;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using PunisherFinTheme.Configuration;
using PunisherFinTheme.Contracts;
using PunisherFinTheme.Integration;

namespace PunisherFinTheme.Api;

[ApiController]
[Route("PunisherFinTheme")]
public sealed class ThemeController : ControllerBase
{
    private const string ScriptResource = "PunisherFinTheme.Web.punisherfin-theme.js";
    private const string StyleResource = "PunisherFinTheme.Web.punisherfin-theme.css";

    [HttpGet("web")]
    [AllowAnonymous]
    [Produces("application/javascript")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public ActionResult WebScript()
    {
        return EmbeddedFile(ScriptResource, "application/javascript; charset=utf-8");
    }

    [HttpGet("styles.css")]
    [AllowAnonymous]
    [Produces("text/css")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public ActionResult Styles()
    {
        return EmbeddedFile(StyleResource, "text/css; charset=utf-8");
    }

    [HttpGet("config")]
    [AllowAnonymous]
    [Produces(MediaTypeNames.Application.Json)]
    [ProducesResponseType(typeof(ClientThemeConfig), StatusCodes.Status200OK)]
    public ActionResult<ClientThemeConfig> Config()
    {
        Settings settings = Plugin.Current?.Configuration ?? new Settings();
        settings.Sanitize();
        return Ok(new ClientThemeConfig
        {
            Enabled = settings.Enabled,
            Accent = settings.AccentColor,
            EpisodeOverview = settings.ShowEpisodeOverview,
            CompactEpisodes = settings.CompactEpisodes,
            ActionButtons = settings.StyleActionButtons,
            Home = settings.StyleHome,
            Libraries = settings.StyleLibraries,
            CardPreviews = settings.EnableCardPreviews,
            PlayerControls = settings.StylePlayerControls,
            Version = typeof(Plugin).Assembly.GetName().Version?.ToString() ?? "0"
        });
    }

    [HttpGet("dependency")]
    [AllowAnonymous]
    [Produces(MediaTypeNames.Application.Json)]
    [ProducesResponseType(typeof(DependencyState), StatusCodes.Status200OK)]
    public ActionResult<DependencyState> Dependency()
    {
        return Ok(new DependencyState
        {
            Connected = ClientRegistration.Connected,
            Message = ClientRegistration.ConnectionMessage,
            Version = typeof(Plugin).Assembly.GetName().Version?.ToString() ?? "0"
        });
    }

    private ActionResult EmbeddedFile(string resourceName, string contentType)
    {
        Stream? stream = Assembly.GetExecutingAssembly().GetManifestResourceStream(resourceName);
        if (stream is null)
        {
            return NotFound();
        }

        Response.Headers.CacheControl = "no-cache, no-store";
        return File(stream, contentType);
    }
}
