using System.Reflection;
using System.Runtime.Loader;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json.Linq;

namespace PunisherFinTheme.Integration;

public sealed class ClientRegistration : BackgroundService
{
    private static readonly Guid PatchId = Guid.Parse("6b6d9c1d-3ffb-4ad1-be2e-145481beefea");
    private static readonly TimeSpan RetryDelay = TimeSpan.FromSeconds(3);
    private const string DependencyAssembly = "Jellyfin.Plugin.FileTransformation";
    private const string DependencyApi = "Jellyfin.Plugin.FileTransformation.PluginInterface";
    private readonly ILogger<ClientRegistration> _logger;

    public ClientRegistration(ILogger<ClientRegistration> logger)
    {
        _logger = logger;
    }

    public static bool Connected { get; private set; }

    public static string ConnectionMessage { get; private set; } = "Verbindung wurde noch nicht geprüft.";

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        int attempt = 0;
        while (!stoppingToken.IsCancellationRequested)
        {
            attempt++;
            if (TryRegister())
            {
                _logger.LogInformation("PunisherFinTheme: Webclient-Erweiterung registriert.");
                return;
            }

            if (attempt == 1 || attempt % 10 == 0)
            {
                _logger.LogWarning("PunisherFinTheme wartet auf File Transformation: {Message}", ConnectionMessage);
            }

            try
            {
                await Task.Delay(RetryDelay, stoppingToken).ConfigureAwait(false);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                return;
            }
        }
    }

    public override async Task StopAsync(CancellationToken cancellationToken)
    {
        try
        {
            if (Connected)
            {
                MethodInfo? remove = LocateDependencyApi()?.GetMethod(
                    "RemoveTransformation",
                    BindingFlags.Public | BindingFlags.Static);
                remove?.Invoke(null, [PatchId]);
            }
        }
        catch (Exception exception)
        {
            _logger.LogDebug(exception, "PunisherFinTheme konnte die Webclient-Erweiterung nicht abmelden.");
        }
        finally
        {
            SetConnection(false, "Webclient-Erweiterung ist nicht registriert.");
        }

        await base.StopAsync(cancellationToken).ConfigureAwait(false);
    }

    private bool TryRegister()
    {
        try
        {
            MethodInfo? register = LocateDependencyApi()?.GetMethod(
                "RegisterTransformation",
                BindingFlags.Public | BindingFlags.Static);
            if (register is null)
            {
                SetConnection(false, "File Transformation 3.0.0 ist noch nicht verfügbar.");
                return false;
            }

            var registration = new JObject
            {
                ["id"] = PatchId.ToString("D"),
                ["fileNamePattern"] = "index.html",
                ["callbackAssembly"] = typeof(IndexHtmlPatch).Assembly.FullName,
                ["callbackClass"] = typeof(IndexHtmlPatch).FullName,
                ["callbackMethod"] = nameof(IndexHtmlPatch.Apply)
            };

            register.Invoke(null, [registration]);
            SetConnection(true, "File Transformation ist verbunden.");
            return true;
        }
        catch (Exception exception)
        {
            SetConnection(false, $"Verbindung fehlgeschlagen: {Unwrap(exception).Message}");
            return false;
        }
    }

    private static Type? LocateDependencyApi()
    {
        Assembly? dependency = AssemblyLoadContext.All
            .SelectMany(context => context.Assemblies)
            .FirstOrDefault(assembly => string.Equals(
                assembly.GetName().Name,
                DependencyAssembly,
                StringComparison.Ordinal));
        return dependency?.GetType(DependencyApi, throwOnError: false, ignoreCase: false);
    }

    private static Exception Unwrap(Exception exception)
    {
        return exception is TargetInvocationException invocation
            ? invocation.InnerException ?? exception
            : exception;
    }

    private static void SetConnection(bool connected, string message)
    {
        Connected = connected;
        ConnectionMessage = message;
    }
}

