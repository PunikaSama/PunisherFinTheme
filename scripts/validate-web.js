"use strict";

const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const settingsPath = path.join(root, "src", "PunisherFinTheme", "Configuration", "settings.html");
const clientPath = path.join(root, "src", "PunisherFinTheme", "Web", "punisherfin-theme.js");
const stylePath = path.join(root, "src", "PunisherFinTheme", "Web", "punisherfin-theme.css");
const html = fs.readFileSync(settingsPath, "utf8");
const client = fs.readFileSync(clientPath, "utf8");
const styles = fs.readFileSync(stylePath, "utf8");

const opening = "<script type=\"text/javascript\">";
const start = html.indexOf(opening);
const end = html.indexOf("</script>", start);
if (start < 0 || end < 0 || start > html.lastIndexOf("</div>")) {
    throw new Error("The settings script must be inside the Jellyfin page container.");
}

new Function(html.slice(start + opening.length, end));
new Function(client);

for (const required of [
    "Enabled",
    "AccentColor",
    "ShowEpisodeOverview",
    "CompactEpisodes",
    "StyleActionButtons",
    "StyleHome",
    "StyleLibraries",
    "EnableCardPreviews",
    "StylePlayerControls",
    "EnableRandomBackground",
    "BackgroundLibraryId",
    "BackgroundOpacityPercent",
    "BackgroundBrightnessPercent",
    "BackgroundBlurPixels",
    "BackgroundSaturationPercent",
    "BackgroundContrastPercent",
    "BackgroundOverlayPercent",
    "BackgroundChangeIntervalSeconds",
    "BackgroundCrossfadeMilliseconds",
    "BackgroundImageQuality",
    "ResetBackgroundSettings",
    "punisherFinThemeSettingsBindings",
    "settingsViews.find",
    "view.querySelector",
    "void showSettings()",
    "syncRangeDisplays",
    "rangeSyncTimer",
    "/PunisherFinTheme/libraries",
    "/PunisherFinTheme/dependency"
]) {
    if (!html.includes(required)) {
        throw new Error(`Missing settings behavior: ${required}`);
    }
}

for (const required of [
    "__punisherFinThemeV136",
    "__punisherFinThemeV135",
    "__punisherFinThemeV134",
    "__punisherFinThemeV130",
    "document.getElementById(\"punisherfin-theme-styles\")",
    "/PunisherFinTheme/config",
    "/PunisherFinTheme/styles.css",
    "MutationObserver",
    "pft-home-view",
    "pft-library-view",
    "pft-action-buttons",
    "pft-hide-episode-overview",
    "pft-compact-episodes",
    "pft-card-previews",
    "pft-player-controls",
    "pft-random-background",
    "punisherFinRandomBackdrop",
    "BackdropImageTags",
    "getUserViews",
    "getItems",
    "backgroundAllowedForCurrentView",
    "videoPlayerContainer-onTop",
    "syncTransparentHeader",
    "restoreTransparentHeader",
    "pft-preview-expanded",
    "pft-season-card",
    "item.Type !== \"Season\"",
    "pft-detail-button-label",
    "removeAttribute(\"title\")",
    "homeSectionsContainer",
    "itemDetailPage"
]) {
    if (!client.includes(required)) {
        throw new Error(`Missing webclient behavior: ${required}`);
    }
}

for (const required of [
    ":root.pft-enabled",
    "--pft-accent",
    ".homeSectionsContainer.pft-home-view",
    ".pft-library-view",
    "#itemDetailPage .mainDetailButtons .btnPlay",
    "#itemDetailPage :is(#childrenCollapsible, #listChildrenCollapsible)",
    "#itemDetailPage .card .itemProgressBar",
    "#itemDetailPage .countIndicator",
    ".pft-preview-expanded",
    ".videoPlayerContainer",
    ".skinHeader-withBackground",
    ".headerTop",
    "--jf-palette-AppBar-defaultBg: transparent",
    "#punisherFinRandomBackdrop",
    ":root:has(.videoPlayerContainer-onTop)",
    ".pft-backdrop-layer",
    ".backgroundContainer",
    "pointer-events: none",
    "@media (max-width: 600px)",
    "@media (prefers-reduced-motion: reduce)"
]) {
    if (!styles.includes(required)) {
        throw new Error(`Missing theme behavior: ${required}`);
    }
}

for (const forbidden of [
    ".headerTabs",
    ".mainDrawer",
    ".itemBackdrop",
    ".detailLogo",
    "punisher-banna-slider"
]) {
    if (styles.includes(forbidden)) {
        throw new Error(`Protected Jellyfin or PunisherBanna selector found: ${forbidden}`);
    }
}
