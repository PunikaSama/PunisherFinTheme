"use strict";

const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

const root = path.resolve(__dirname, "..");
const settingsPath = path.join(root, "src", "PunisherFinTheme", "Configuration", "settings.html");
const clientPath = path.join(root, "src", "PunisherFinTheme", "Web", "punisherfin-theme.js");
const stylePath = path.join(root, "src", "PunisherFinTheme", "Web", "punisherfin-theme.css");
const cinematicStylePath = path.join(root, "src", "PunisherFinTheme", "Web", "Designs", "cinematic-theme.css");
const settingsStylePath = path.join(root, "src", "PunisherFinTheme", "Web", "settings-design.css");
const html = fs.readFileSync(settingsPath, "utf8");
const client = fs.readFileSync(clientPath, "utf8");
const styles = fs.readFileSync(stylePath, "utf8");
const cinematicStyles = fs.readFileSync(cinematicStylePath, "utf8");
const settingsStyles = fs.readFileSync(settingsStylePath, "utf8");

const normalizedDefaultStyles = styles.replace(/\r\n/g, "\n");
const defaultStyleHash = crypto.createHash("sha256").update(normalizedDefaultStyles).digest("hex");
if (defaultStyleHash !== "dbaa52f9d1216bbbed911232b9a1d769c997cfeefe9dc33dfb7f4da61c10d5a2") {
    throw new Error("The reviewed PunisherFin default design baseline changed unexpectedly.");
}

const opening = "<script type=\"text/javascript\">";
const start = html.indexOf(opening);
const end = html.indexOf("</script>", start);
if (start < 0 || end < 0 || start > html.lastIndexOf("</div>")) {
    throw new Error("The settings script must be inside the Jellyfin page container.");
}

new Function(html.slice(start + opening.length, end));
new Function(client);

for (const required of [
    "SettingsLanguage",
    "normalizeSettingsLanguage",
    "translations",
    "applyLanguage",
    "data-i18n",
    "data-i18n-aria-label",
    "settings.SettingsLanguage = currentLanguage()",
    "Enabled",
    "AccentColor",
    "DesignPreset",
    "DesignPunisherFin",
    "DesignCinematic",
    "DesignPreview",
    "pft-design-home",
    "pft-mini-hero",
    "Cinema Deck",
    "syncDesignPreview",
    "ensureSettingsStylesheet",
    "/PunisherFinTheme/settings.css",
    "punisherfin-theme-settings-styles",
    "selectedDesign",
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
    "BackgroundPreview",
    "BackgroundPreviewLayer1",
    "BackgroundPreviewLayer2",
    "RefreshBackgroundPreview",
    "applyPreviewEffects",
    "loadRandomPreview",
    "chooseRandomPreview",
    "BackdropImageTags",
    "IncludeItemTypes: \"Series,Movie\"",
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

for (const required of [
    "Settings language",
    "Sprache der Einstellungen",
    "The PunisherFinTheme settings could not be loaded.",
    "Die PunisherFinTheme-Einstellungen konnten nicht geladen werden.",
    "File Transformation is connected.",
    "File Transformation ist verbunden."
]) {
    if (!html.includes(required)) {
        throw new Error(`Missing bilingual settings text: ${required}`);
    }
}

for (const required of [
    ".pft-design-picker",
    ".pft-design-home",
    ".pft-mini-shelf",
    ".pft-design-preview[data-design=\"cinematic\"]",
    "var(--pft-settings-accent)",
    "@media (max-width: 600px)"
]) {
    if (!settingsStyles.includes(required)) {
        throw new Error(`Missing external settings gallery style: ${required}`);
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
    "__punisherFinThemeV213",
    "__punisherFinThemeV140",
    "__punisherFinThemeV139",
    "__punisherFinThemeV138",
    "__punisherFinThemeV137",
    "__punisherFinThemeV136",
    "__punisherFinThemeV135",
    "__punisherFinThemeV134",
    "__punisherFinThemeV130",
    "document.getElementById(\"punisherfin-theme-styles\")",
    "punisherfin-theme-design-styles",
    "/PunisherFinTheme/config",
    "/PunisherFinTheme/styles.css",
    "/PunisherFinTheme/designs/cinematic.css",
    "data-pft-design",
    "normalizeDesign",
    "ensureDesignStylesheet",
    "/PunisherFinTheme/logo.png",
    "MutationObserver",
    "accentChannel",
    "--jf-palette-primary-mainChannel",
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
    "brandingFavicons",
    "brandingDocumentTitle",
    "document.title = \"PunisherFin\"",
    "headObserver",
    "brandingTextNode",
    "link[rel~='icon']",
    "pft-brand-drawer-link",
    "MuiListItemText-primary",
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
    "#searchPage .searchSuggestions .button-link",
    ".searchfields-txtSearch",
    ".defaultCardBackground1",
    ".defaultCardBackground2",
    ".defaultCardBackground3",
    ".defaultCardBackground4",
    ".defaultCardBackground5",
    ".MuiOutlinedInput-notchedOutline",
    ".alphaPickerButton-selected",
    ".button-submit"
]) {
    if (!styles.includes(required)) {
        throw new Error(`Missing global accent coverage: ${required}`);
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
    ".cardOverlayButton",
    ".MuiIconButton-root",
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
    ".nowPlayingBar",
    ".nowPlayingBarPositionSlider",
    ".nowPlayingBarVolumeSlider",
    ".sliderMarker.watched",
    ".MuiSwitch-switchBase.Mui-checked",
    ".MuiCheckbox-root.Mui-checked",
    ".MuiTabs-indicator",
    ".mdl-switch__input:checked",
    ".mdl-radio__focus-circle",
    "progress:not(.recordingProgressBar)",
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

for (const required of [
    ":root.pft-enabled[data-pft-design=\"cinematic\"]",
    "--pft-accent",
    ".homeSectionsContainer.pft-home-view",
    ".pft-library-view",
    "#itemDetailPage",
    ".pft-season-card",
    ".listItem-withContentWrapper",
    ".videoPlayerContainer",
    ".nowPlayingBar",
    "#previewPopup",
    "@media (max-width: 600px)",
    "@media (prefers-reduced-motion: reduce)"
]) {
    if (!cinematicStyles.includes(required)) {
        throw new Error(`Missing Cinematic design behavior: ${required}`);
    }
}

if (/#(?:00a4dc|52b54b|ff5f87)\b/i.test(cinematicStyles)) {
    throw new Error("Cinematic action colors must use the global accent variables.");
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
