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
    "EnablePunisherFinBranding",
    "ShowEpisodeOverview",
    "CompactEpisodes",
    "StyleActionButtons",
    "StyleHome",
    "StyleLibraries",
    "EnableCardPreviews",
    "EnableVideoPreviews",
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
    "applySettings",
    "loadOptionalInformation",
    "loadedSettings",
    "view.dataset.bound",
    "window.setTimeout",
    "scheduleSettingsLoad",
    "typeof ApiClient.getPluginConfiguration",
    "syncRangeDisplays",
    "/PunisherFinTheme/libraries",
    "/PunisherFinTheme/dependency"
]) {
    if (!html.includes(required)) {
        throw new Error(`Missing settings behavior: ${required}`);
    }
}

for (const forbidden of [
    "Promise.all",
    "punisherFinThemeSettingsBindings",
    "AbortController",
    "?."
]) {
    if (html.includes(forbidden)) {
        throw new Error(`Fragile settings behavior found: ${forbidden}`);
    }
}

for (const required of [
    "__punisherFinThemeV138",
    "__punisherFinThemeV137",
    "__punisherFinThemeV136",
    "__punisherFinThemeV135",
    "__punisherFinThemeV134",
    "__punisherFinThemeV130",
    "document.getElementById(\"punisherfin-theme-styles\")",
    "/PunisherFinTheme/config",
    "/PunisherFinTheme/styles.css",
    "/PunisherFinTheme/logo.png",
    "MutationObserver",
    "pft-home-view",
    "pft-library-view",
    "pft-action-buttons",
    "pft-hide-episode-overview",
    "pft-compact-episodes",
    "pft-card-previews",
    "pft-video-previews",
    "firstEpisodeForPreview",
    "previewStartTicks",
    "videoPreviewUrl",
    "stopVideoPreview",
    "stream.mp4",
    "video.muted = true",
    "video.playsInline = true",
    "pft-player-controls",
    "pft-random-background",
    "pft-branding",
    "syncBranding",
    "restoreBranding",
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
    "pft-media-preview-card",
    "[\"Episode\", \"Movie\", \"Series\", \"Season\", \"Video\"].includes(item.Type)",
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
    ".MuiButtonGroup-root",
    ".MuiButton-contained",
    ".MuiButton-containedPrimary",
    ".btnPlayAll, .btnShuffle",
    "#itemDetailPage .mainDetailButtons .btnPlay",
    "#itemDetailPage :is(#childrenCollapsible, #listChildrenCollapsible)",
    "#itemDetailPage .card .itemProgressBar",
    "#itemDetailPage .countIndicator",
    ".pft-preview-expanded",
    ".pft-preview-video",
    ".pft-preview-video-playing",
    ".pft-preview-expanded .cardBox",
    "0 0 0 1px var(--pft-accent) !important",
    ".videoPlayerContainer",
    ":root.pft-enabled :is(.videoPlayerContainer",
    ".cardOverlayButtonIcon",
    ".cardOverlayFab-primary",
    "--jf-palette-primary-main: var(--pft-accent)",
    "accent-color: var(--pft-accent)",
    ".mdl-slider__background-lower",
    ".iconOsdProgressInner",
    ".osdVolumeSliderContainer, .volumeOsd) .sliderBubble",
    "InPlayerEpisodePreview compatibility",
    "#previewPopup",
    ".previewListItem.selectedListItem",
    "#previewPopup .itemProgressBarForeground",
    "#previewPopup .cardOverlayFab-primary",
    ".cardOverlayFab-primary .cardOverlayButtonIcon",
    "background: transparent !important",
    "#popupPreviewButton:is(:hover, :focus-visible)",
    "[data-played=\"true\"] .playstatebutton-icon-played",
    "[data-isfavorite=\"true\"] .favorite",
    ".previewPopupScroller::-webkit-scrollbar-thumb",
    ".docspinner .mdl-spinner__layer",
    ".MuiCircularProgress-root",
    ".progressring-spiner, .loadingSpinner",
    ".MuiSlider-track",
    "::-webkit-slider-thumb",
    "::-moz-range-progress",
    ".skinHeader-withBackground",
    ".headerTop",
    ".MuiAppBar-root",
    "MuiPaper-elevation",
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

if (client.includes("video.loop = true")) {
    throw new Error("Video previews must be bounded clips, not unlimited looping streams.");
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

if (/pft-preview-expanded[\s\S]{0,250}border-color:\s*#fff/i.test(styles)) {
    throw new Error("Expanded card previews must use the configured accent color, not a white border.");
}

if (/pft-player-controls[^\{]*\{[\s\S]{0,250}accent-color:\s*var\(--pft-accent\)/i.test(styles)) {
    throw new Error("Player accent colors must not depend on the optional enlarged-controls setting.");
}

if (/:is\([^)]*\.sliderBubble(?![\w-])[^)]*\)[^{]*\{[^}]*background(?:-color)?:\s*var\(--pft-accent\)/i.test(styles)) {
    throw new Error("Slider tooltip bubbles must not be painted as solid accent blocks.");
}

if (/\.card:is\([^)]*:hover[^)]*\)\s+\.cardOverlayFab-primary/i.test(styles)) {
    throw new Error("Preview play buttons must only receive the accent when the button itself is hovered.");
}

if (/\.pft-library-view\s+:is\(\.MuiButtonGroup-root/i.test(styles)) {
    throw new Error("Primary MUI button groups must receive the accent even when optional library styling is disabled.");
}
