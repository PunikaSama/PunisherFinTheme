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
        this.attributes = {};
    }

    addEventListener(name, handler) {
        this.listeners[name] = this.listeners[name] || [];
        this.listeners[name].push(handler);
    }

    setAttribute(name, value) {
        this.attributes[name] = String(value);
    }

    getAttribute(name) {
        return this.attributes[name] || null;
    }

    querySelector(selector) {
        if (selector === 'option[value=""]') {
            return this.children.find((child) => child.value === "") || null;
        }

        return null;
    }

    querySelectorAll() {
        return [];
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

    for (const match of html.matchAll(/<(input|select|form|button|div|section|span|small|output)[^>]*\sid="([^"]+)"[^>]*>/gi)) {
        elements[match[2]] = new FakeElement(match[2], match[1]);
    }

    const document = {
        head: new FakeElement("", "head"),
        getElementById(id) {
            return elements[id] || null;
        },
        createElement(tagName) {
            return new FakeElement("", tagName);
        }
    };
    const window = { setTimeout, clearTimeout };
    const expected = {
        SettingsLanguage: "en",
        Enabled: true,
        AccentColor: "#19AABB",
        DesignPreset: "cinematic",
        EnablePunisherFinBranding: true,
        ShowEpisodeOverview: true,
        CompactEpisodes: true,
        StyleActionButtons: true,
        StyleHome: true,
        StyleLibraries: true,
        EnableCardPreviews: true,
        EnableVideoPreviews: true,
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
    let lastItemsQuery = null;
    const getPluginConfiguration = function () {
        return Promise.resolve({ ...expected });
    };
    const ApiClient = {
        updatePluginConfiguration(pluginId, settings) {
            saved = { pluginId, settings: { ...settings } };
            return Promise.resolve({});
        },
        getUrl(requestPath, query) {
            if (requestPath === "/Items") {
                lastItemsQuery = query;
            }
            return requestPath;
        },
        fetch(request) {
            if (request.url === "/PunisherFinTheme/dependency") {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({ connected: true, message: "Verbunden", version: "test" })
                });
            }

            if (request.url === "/Items") {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({
                        Items: [{
                            Id: "preview-item",
                            BackdropImageTags: ["preview-tag"]
                        }]
                    })
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
    assert.equal(document.head.children.length, 1, "Settings page must inject its external gallery stylesheet");
    assert.equal(document.head.children[0].id, "punisherfin-theme-settings-styles", "Settings stylesheet must have a stable cache-safe id");
    assert.equal(document.head.children[0].href, "/PunisherFinTheme/settings.css", "Settings gallery must load from the plugin CSS endpoint");
    await settle();
    assert.equal(elements.Enabled.checked, false, "Page must wait until Jellyfin's API client is ready");
    ApiClient.getPluginConfiguration = getPluginConfiguration;
    await new Promise((resolve) => setTimeout(resolve, 210));
    await settle();
    await settle();

    assert.equal(elements.Enabled.checked, true, "Saved enabled state must be restored");
    assert.equal(elements.DesignCinematic.checked, true, "Saved design must be restored");
    assert.equal(elements.DesignPreview.dataset.design, "cinematic", "Saved design must update the live preview");
    assert.equal(elements.DesignPreviewTitle.textContent, "Cinema Deck", "Live preview must identify the selected design");
    assert.equal(elements.DesignSection.style["--pft-settings-accent"], expected.AccentColor, "Live preview must use the saved global accent");
    assert.equal(elements.EnablePunisherFinBranding.checked, true, "Saved branding state must be restored");
    assert.equal(elements.CompactEpisodes.checked, true, "Saved checkbox state must be restored");
    assert.equal(elements.EnableVideoPreviews.checked, true, "Video previews must be enabled by default and restored");
    assert.equal(elements.BackgroundOpacityPercent.value, 77, "Saved slider position must be restored");
    assert.equal(elements.BackgroundOpacityPercentValue.textContent, "77 %", "Saved slider label must be restored");
    assert.equal(elements.BackgroundLibraryId.value, expected.BackgroundLibraryId, "Saved library must survive a failed library lookup");
    assert.equal(elements.SettingsLanguage.value, "en", "English must be the default settings language");
    assert.equal(elements.DependencyMessage.textContent, "File Transformation is connected.", "Dependency state must be localized independently");
    await settle();
    assert.match(
        elements.BackgroundPreviewLayer1.style.backgroundImage || elements.BackgroundPreviewLayer2.style.backgroundImage || "",
        /preview-item/,
        "Preview must use a backdrop from the selected library"
    );
    assert.equal(lastItemsQuery.ParentId, expected.BackgroundLibraryId, "Preview must query the selected library only");
    elements.RefreshBackgroundPreview.dispatch("click");
    await settle();
    assert.match(elements.BackgroundPreviewLayer1.style.backgroundImage || "", /preview-item/, "Random-preview button must display another backdrop");

    elements.BackgroundOpacityPercent.value = "42";
    elements.BackgroundOpacityPercent.dispatch("input");
    assert.equal(elements.BackgroundOpacityPercentValue.textContent, "42 %", "Slider label must update while dragging");
    assert.ok(
        [elements.BackgroundPreviewLayer1.style.opacity, elements.BackgroundPreviewLayer2.style.opacity].includes("0.42"),
        "Preview opacity must update while dragging"
    );

    elements.AccentColor.value = "#7733CC";
    elements.AccentColor.dispatch("input");
    assert.equal(elements.DesignSection.style["--pft-settings-accent"], "#7733CC", "Global accent must update the design preview immediately");

    elements.Enabled.checked = false;
    elements.DesignCinematic.checked = false;
    elements.DesignPunisherFin.checked = true;
    elements.DesignPunisherFin.dispatch("change");
    assert.equal(elements.DesignSection.style["--pft-settings-accent"], "#7733CC", "Switching designs must not reset the global accent preview");
    elements.EnablePunisherFinBranding.checked = false;
    elements.StyleHome.checked = false;
    elements.EnableVideoPreviews.checked = false;
    elements.SettingsLanguage.value = "de";
    elements.SettingsLanguage.dispatch("change");
    assert.equal(elements.DependencyMessage.textContent, "File Transformation ist verbunden.", "Language switch must update dynamic status text immediately");
    elements.PunisherFinThemeSettingsForm.dispatch("submit");
    await settle();

    assert.ok(saved, "Submit must call updatePluginConfiguration");
    assert.equal(saved.pluginId, "4763374d-d1ce-4404-b769-3625dacdcb84");
    assert.equal(saved.settings.Enabled, false, "Changed checkbox state must be saved");
    assert.equal(saved.settings.SettingsLanguage, "de", "Selected settings language must be saved");
    assert.equal(saved.settings.DesignPreset, "punisherfin", "Changed design must be saved independently");
    assert.equal(saved.settings.AccentColor, "#7733CC", "Changing designs must preserve the global accent color");
    assert.equal(saved.settings.EnablePunisherFinBranding, false, "Changed branding state must be saved");
    assert.equal(saved.settings.StyleHome, false, "Every changed checkbox state must be saved");
    assert.equal(saved.settings.EnableVideoPreviews, false, "Video preview preference must be saved");
    assert.equal(saved.settings.BackgroundOpacityPercent, 42, "Changed slider value must be saved");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
