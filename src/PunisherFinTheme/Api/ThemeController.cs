using System.Net.Mime;
using System.Reflection;
using MediaBrowser.Common.Api;
using MediaBrowser.Controller.Entities;
using MediaBrowser.Controller.Library;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
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
    private readonly IUserManager _users;
    private readonly ILibraryManager _library;
    private readonly ILogger<ThemeController> _logger;

    public ThemeController(IUserManager users, ILibraryManager library, ILogger<ThemeController> logger)
    {
        _users = users;
        _library = library;
        _logger = logger;
    }

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
            RandomBackground = settings.EnableRandomBackground,
            BackgroundLibraryId = settings.BackgroundLibraryId,
            BackgroundLibraryName = settings.BackgroundLibraryName,
            BackgroundInterval = settings.BackgroundChangeIntervalSeconds,
            BackgroundOpacity = settings.BackgroundOpacityPercent,
            BackgroundBrightness = settings.BackgroundBrightnessPercent,
            BackgroundBlur = settings.BackgroundBlurPixels,
            BackgroundSaturation = settings.BackgroundSaturationPercent,
            BackgroundContrast = settings.BackgroundContrastPercent,
            BackgroundOverlay = settings.BackgroundOverlayPercent,
            BackgroundCrossfade = settings.BackgroundCrossfadeMilliseconds,
            BackgroundQuality = settings.BackgroundImageQuality,
            HideBackgroundOnDetails = settings.HideRandomBackgroundOnDetails,
            HideBackgroundInPlayer = settings.HideRandomBackgroundInPlayer,
            Version = typeof(Plugin).Assembly.GetName().Version?.ToString() ?? "0"
        });
    }

    [HttpGet("libraries")]
    [Authorize(Policy = Policies.RequiresElevation)]
    [Produces(MediaTypeNames.Application.Json)]
    [ProducesResponseType(typeof(IReadOnlyList<LibraryOption>), StatusCodes.Status200OK)]
    public ActionResult<IReadOnlyList<LibraryOption>> Libraries()
    {
        var choices = new Dictionary<Guid, LibraryOption>();
        try
        {
            foreach (var folder in _library.GetVirtualFolders())
            {
                if (Guid.TryParse(folder.ItemId, out Guid id) && !string.IsNullOrWhiteSpace(folder.Name))
                {
                    choices[id] = new LibraryOption
                    {
                        Id = id.ToString("D"),
                        Name = folder.Name,
                        CollectionType = folder.CollectionType?.ToString()
                    };
                }
            }

            string? username = User.Identity?.Name;
            Jellyfin.Database.Implementations.Entities.User? user = string.IsNullOrWhiteSpace(username)
                ? null
                : _users.GetUserByName(username);
            if (user is not null)
            {
                foreach (BaseItem child in _library.GetUserRootFolder().GetChildren(user, true))
                {
                    if (!string.IsNullOrWhiteSpace(child.Name))
                    {
                        choices.TryAdd(child.Id, new LibraryOption
                        {
                            Id = child.Id.ToString("D"),
                            Name = child.Name
                        });
                    }
                }
            }

            return Ok(choices.Values.OrderBy(choice => choice.Name, StringComparer.CurrentCultureIgnoreCase).ToArray());
        }
        catch (Exception exception)
        {
            _logger.LogError(exception, "PunisherFinTheme konnte die Bibliotheksliste nicht laden.");
            return Ok(Array.Empty<LibraryOption>());
        }
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
