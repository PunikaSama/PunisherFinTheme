"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

class FakeElement {
    constructor(id, tagName) {
        this.id = id || "";
        this.tagName = String(tagName || "div").toUpperCase();
        this.value = "";
        this.checked = false;
        this.textContent = "";
        this.style = {};
        this.dataset = {};
        this.children = [];
        this.listeners = {};
    }

    addEventListener(name, handler) {
        this.listeners[name] = this.listeners[name] || [];
        this.listeners[name].push(handler);
    }

    dispatch(name) {
        const event = {
            target: this,
            preventDefault() {},
            stopImmediatePropagation() {}
        };
        (this.listeners[name] || []).forEach((handler) => handler(event));
    }

    appendChild(child) {
        this.children.push(child);
        return child;
    }

    removeChild(child) {
        this.children.splice(this.children.indexOf(child), 1);
        return child;
    }

    get firstChild() {
        return this.children[0] || null;
    }

    get options() {
        return this.children;
    }

    get selectedIndex() {
        return this.children.findIndex((child) => child.value === this.value);
    }
}

function settle() {
    return new Promise((resolve) => setTimeout(resolve, 0));
}

async function main() {
    const root = path.resolve(__dirname, "..");
    const html = fs.readFileSync(path.join(root, "src", "PunisherFinTheme", "Configuration", "settings.html"), "utf8");
    const opening = "<script type=\"text/javascript\">";
    const start = html.indexOf(opening) + opening.length;
    const end = html.indexOf("</script>", start);
    const script = html.slice(start, end);
    const elements = {};

    for (const match of html.matchAll(/<(input|select|form|button|div|small|output)[^>]*\sid="([^"]+)"[^>]*>/gi)) {
        elements[match[2]] = new FakeElement(match[2], match[1]);
    }

    const document = {
        getElementById(id) {
            return elements[id] || null;
        },
        createElement(tagName) {
            return new FakeElement("", tagName);
        }
    };
    const window = { setTimeout };
    const expected = {
        Enabled: true,
        AccentColor: "#19AABB",
        ShowEpisodeOverview: true,
        CompactEpisodes: true,
        StyleActionButtons: true,
        StyleHome: true,
        StyleLibraries: true,
        EnableCardPreviews: true,
        StylePlayerControls: true,
        EnableRandomBackground: true,
        BackgroundLibraryId: "11111111-1111-1111-1111-111111111111",
        BackgroundLibraryName: "Anime",
        BackgroundOpacityPercent: 77,
        BackgroundBrightnessPercent: 81,
        BackgroundBlurPixels: 4,
        BackgroundSaturationPercent: 123,
        BackgroundContrastPercent: 112,
        BackgroundOverlayPercent: 31,
        BackgroundChangeIntervalSeconds: 45,
        BackgroundCrossfadeMilliseconds: 1750,
        BackgroundImageQuality: 84
    };
    let saved = null;
    const getPluginConfiguration = function () {
        return Promise.resolve({ ...expected });
    };
    const ApiClient = {
        updatePluginConfiguration(pluginId, settings) {
            saved = { pluginId, settings: { ...settings } };
            return Promise.resolve({});
        },
        getUrl(requestPath) {
            return requestPath;
        },
        fetch(request) {
            if (request.url === "/PunisherFinTheme/dependency") {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({ connected: true, message: "Verbunden", version: "test" })
                });
            }

            return Promise.reject(new Error("Bibliotheksabfrage absichtlich fehlgeschlagen"));
        },
        getVirtualFolders() {
            return Promise.reject(new Error("Virtual Folders absichtlich fehlgeschlagen"));
        },
        getCurrentUserId() {
            return "test-user";
        }
    };
    const Dashboard = {
        showLoadingMsg() {},
        hideLoadingMsg() {},
        alert(message) {
            throw new Error(message);
        },
        processPluginConfigurationUpdateResult() {}
    };
    const quietConsole = {
        debug() {},
        warn() {},
        error: console.error
    };

    new Function("document", "window", "ApiClient", "Dashboard", "console", script)(document, window, ApiClient, Dashboard, quietConsole);
    await settle();
    assert.equal(elements.Enabled.checked, false, "Page must wait until Jellyfin's API client is ready");
    ApiClient.getPluginConfiguration = getPluginConfiguration;
    await new Promise((resolve) => setTimeout(resolve, 210));
    await settle();
    await settle();

    assert.equal(elements.Enabled.checked, true, "Saved enabled state must be restored");
    assert.equal(elements.CompactEpisodes.checked, true, "Saved checkbox state must be restored");
    assert.equal(elements.BackgroundOpacityPercent.value, 77, "Saved slider position must be restored");
    assert.equal(elements.BackgroundOpacityPercentValue.textContent, "77 %", "Saved slider label must be restored");
    assert.equal(elements.BackgroundLibraryId.value, expected.BackgroundLibraryId, "Saved library must survive a failed library lookup");
    assert.equal(elements.DependencyMessage.textContent, "Verbunden", "Dependency state must load independently");

    elements.BackgroundOpacityPercent.value = "42";
    elements.BackgroundOpacityPercent.dispatch("input");
    assert.equal(elements.BackgroundOpacityPercentValue.textContent, "42 %", "Slider label must update while dragging");

    elements.Enabled.checked = false;
    elements.StyleHome.checked = false;
    elements.PunisherFinThemeSettingsForm.dispatch("submit");
    await settle();

    assert.ok(saved, "Submit must call updatePluginConfiguration");
    assert.equal(saved.pluginId, "4763374d-d1ce-4404-b769-3625dacdcb84");
    assert.equal(saved.settings.Enabled, false, "Changed checkbox state must be saved");
    assert.equal(saved.settings.StyleHome, false, "Every changed checkbox state must be saved");
    assert.equal(saved.settings.BackgroundOpacityPercent, 42, "Changed slider value must be saved");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
