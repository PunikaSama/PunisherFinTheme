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
    "/PunisherFinTheme/dependency"
]) {
    if (!html.includes(required)) {
        throw new Error(`Missing settings behavior: ${required}`);
    }
}

for (const required of [
    "__punisherFinThemeV121",
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
    "pft-preview-expanded",
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
    ".pft-preview-expanded",
    ".videoPlayerContainer",
    "@media (max-width: 600px)",
    "@media (prefers-reduced-motion: reduce)"
]) {
    if (!styles.includes(required)) {
        throw new Error(`Missing theme behavior: ${required}`);
    }
}

for (const forbidden of [
    ".skinHeader",
    ".headerTop",
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
