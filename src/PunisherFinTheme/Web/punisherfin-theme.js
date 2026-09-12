(function () {
    "use strict";

    ["__punisherFinThemeV121", "__punisherFinThemeV130", "__punisherFinThemeV134", "__punisherFinThemeV135", "__punisherFinThemeV136", "__punisherFinThemeV137", "__punisherFinThemeV138", "__punisherFinThemeV139", "__punisherFinThemeV140"].forEach(key => {
        window[key]?.stop?.();
        delete window[key];
    });
    const runtimeKey = "__punisherFinThemeV200";
    if (window[runtimeKey]) {
        return;
    }

    const root = document.documentElement;
    const markerClasses = ["pft-enabled", "pft-branding", "pft-action-buttons", "pft-hide-episode-overview", "pft-compact-episodes", "pft-card-previews", "pft-video-previews", "pft-player-controls", "pft-random-background"];
    const pageClasses = ["pft-home-view", "pft-library-view"];
    const runtime = {
        config: null,
        timer: null,
        reloadRequested: false,
        loading: false,
        stylesheet: null,
        designStylesheet: null,
        designGeneration: 0,
        observer: null,
        previewCache: new Map(),
        previewVideoItemCache: new Map(),
        resumeMinutes: new Map(),
        previewTimer: null,
        videoPreviewTimer: null,
        previewClipTimer: null,
        previewVideoGeneration: 0,
        activePreviewVideo: null,
        activeCard: null,
        backgroundContainer: null,
        backgroundInterval: null,
        backgroundSignature: null,
        backgroundGeneration: 0,
        backgroundItems: [],
        backgroundLayer: 0,
        lastBackgroundItem: null,
        headerStyles: new Map(),
        brandingElements: new Map(),
        brandingFavicons: new Map(),
        brandingFavicon: null
    };

    function jellyfinApi() {
        return window.ApiClient || (typeof ApiClient !== "undefined" ? ApiClient : null);
    }

    function visible(element) {
        return Boolean(element && element.isConnected && !element.classList.contains("hide") && element.getClientRects().length);
    }

    function accentChannel(color) {
        const match = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(color || "");
        return match
            ? `${parseInt(match[1], 16)} ${parseInt(match[2], 16)} ${parseInt(match[3], 16)}`
            : "255 95 135";
    }

    function ensureStylesheet(api, version) {
        const href = api.getUrl("/PunisherFinTheme/styles.css", { v: version || "1" });
        const existing = runtime.stylesheet?.isConnected
            ? runtime.stylesheet
            : document.getElementById("punisherfin-theme-styles");
        if (existing) {
            if (existing.href !== new URL(href, window.location.href).href) {
                existing.href = href;
            }
            runtime.stylesheet = existing;
            return;
        }
        const link = document.createElement("link");
        link.id = "punisherfin-theme-styles";
        link.rel = "stylesheet";
        link.href = href;
        document.head.appendChild(link);
        runtime.stylesheet = link;
    }

    function normalizeDesign(design) {
        return String(design || "").toLowerCase() === "cinematic" ? "cinematic" : "punisherfin";
    }

    function removeDesignStylesheet() {
        runtime.designGeneration += 1;
        const existing = runtime.designStylesheet?.isConnected
            ? runtime.designStylesheet
            : document.getElementById("punisherfin-theme-design-styles");
        existing?.remove();
        runtime.designStylesheet = null;
    }

    function ensureDesignStylesheet(api, config) {
        const design = config?.enabled ? normalizeDesign(config.designPreset) : "punisherfin";
        if (design === "punisherfin") {
            removeDesignStylesheet();
            if (config?.enabled) {
                root.setAttribute("data-pft-design", "punisherfin");
            } else {
                root.removeAttribute("data-pft-design");
            }
            return;
        }

        const href = api.getUrl("/PunisherFinTheme/designs/cinematic.css", { v: config.version || "1" });
        const absoluteHref = new URL(href, window.location.href).href;
        const existing = runtime.designStylesheet?.isConnected
            ? runtime.designStylesheet
            : document.getElementById("punisherfin-theme-design-styles");
        if (existing?.href === absoluteHref) {
            runtime.designStylesheet = existing;
            root.setAttribute("data-pft-design", design);
            return;
        }

        const generation = ++runtime.designGeneration;
        const link = document.createElement("link");
        link.id = "punisherfin-theme-design-styles";
        link.rel = "stylesheet";
        link.href = href;
        link.addEventListener("load", () => {
            if (generation !== runtime.designGeneration || normalizeDesign(runtime.config?.designPreset) !== design) {
                link.remove();
                return;
            }
            existing?.remove();
            runtime.designStylesheet = link;
            root.setAttribute("data-pft-design", design);
        }, { once: true });
        link.addEventListener("error", () => {
            if (generation !== runtime.designGeneration) {
                return;
            }
            link.remove();
            runtime.designStylesheet = null;
            root.setAttribute("data-pft-design", "punisherfin");
            console.warn(`PunisherFinTheme: Design '${design}' konnte nicht geladen werden. PunisherFin bleibt aktiv.`);
        }, { once: true });
        document.head.appendChild(link);
    }

    function directTextNode(element) {
        return Array.from(element?.childNodes || []).find(node => node.nodeType === 3 && node.nodeValue?.trim()) || null;
    }

    function brandingLogoUrl() {
        const api = jellyfinApi();
        return api ? api.getUrl("/PunisherFinTheme/logo.png", { v: runtime.config?.version || "1" }) : null;
    }

    function restoreBranding() {
        runtime.brandingElements.forEach((snapshot, element) => {
            if (!element.isConnected) {
                return;
            }
            if (snapshot.kind === "modern") {
                const image = element.querySelector("img");
                if (image && snapshot.imageSource !== null) {
                    image.setAttribute("src", snapshot.imageSource);
                }
                const text = directTextNode(element);
                if (text) {
                    text.nodeValue = snapshot.text;
                }
                element.classList.remove("pft-brand-button");
                image?.classList.remove("pft-brand-logo");
            } else if (snapshot.kind === "drawer") {
                const image = element.querySelector(".MuiListItemIcon-root img, [class*='MuiListItemIcon-root'] img");
                const primary = element.querySelector(".MuiListItemText-primary, [class*='MuiListItemText-primary']");
                if (image && snapshot.imageSource !== null) {
                    image.setAttribute("src", snapshot.imageSource);
                }
                if (primary) {
                    primary.textContent = snapshot.text;
                }
                element.classList.remove("pft-brand-drawer-link");
                image?.classList.remove("pft-brand-logo");
            } else {
                element.textContent = snapshot.text;
                element.classList.remove("pft-brand-title");
                element.style.removeProperty("--pft-brand-logo");
            }
        });
        runtime.brandingElements.clear();
        runtime.brandingFavicons.forEach((snapshot, favicon) => {
            if (snapshot.href === null) {
                favicon.removeAttribute("href");
            } else {
                favicon.setAttribute("href", snapshot.href);
            }
            if (snapshot.type === null) {
                favicon.removeAttribute("type");
            } else {
                favicon.setAttribute("type", snapshot.type);
            }
        });
        runtime.brandingFavicons.clear();
        runtime.brandingFavicon?.remove();
        runtime.brandingFavicon = null;
    }

    function syncBranding() {
        if (!runtime.config?.enabled || runtime.config.branding !== true) {
            restoreBranding();
            return;
        }

        runtime.brandingElements.forEach((snapshot, element) => {
            if (!element.isConnected) {
                runtime.brandingElements.delete(element);
            }
        });

        const logoUrl = brandingLogoUrl();
        if (!logoUrl) {
            return;
        }

        document.querySelectorAll("link[rel~='icon']").forEach(favicon => {
            if (favicon.id === "punisherfin-branding-favicon") {
                return;
            }
            if (!runtime.brandingFavicons.has(favicon)) {
                runtime.brandingFavicons.set(favicon, {
                    href: favicon.getAttribute("href"),
                    type: favicon.getAttribute("type")
                });
            }
            favicon.setAttribute("href", logoUrl);
            favicon.setAttribute("type", "image/png");
        });

        if (!runtime.brandingFavicon?.isConnected) {
            const favicon = document.createElement("link");
            favicon.id = "punisherfin-branding-favicon";
            favicon.rel = "shortcut icon";
            favicon.type = "image/png";
            document.head.appendChild(favicon);
            runtime.brandingFavicon = favicon;
        }
        runtime.brandingFavicon.href = logoUrl;

        document.querySelectorAll(".MuiAppBar-root a[href], [class*='MuiAppBar-root'] a[href]").forEach(button => {
            const image = button.querySelector("img");
            const text = directTextNode(button);
            if (!image || !text) {
                return;
            }
            if (!runtime.brandingElements.has(button)) {
                runtime.brandingElements.set(button, {
                    kind: "modern",
                    imageSource: image.getAttribute("src"),
                    text: text.nodeValue
                });
            }
            if (image.getAttribute("src") !== logoUrl) {
                image.setAttribute("src", logoUrl);
            }
            image.classList.add("pft-brand-logo");
            if (text.nodeValue !== "PunisherFin") {
                text.nodeValue = "PunisherFin";
            }
            button.classList.add("pft-brand-button");
        });

        document.querySelectorAll(".dashboardDocument .MuiDrawer-root a[href], .dashboardDocument [class*='MuiDrawer-root'] a[href]").forEach(link => {
            const image = link.querySelector(".MuiListItemIcon-root img, [class*='MuiListItemIcon-root'] img");
            const primary = link.querySelector(".MuiListItemText-primary, [class*='MuiListItemText-primary']");
            const secondary = link.querySelector(".MuiListItemText-secondary, [class*='MuiListItemText-secondary']");
            if (!image || !primary || !secondary) {
                return;
            }
            if (!runtime.brandingElements.has(link)) {
                runtime.brandingElements.set(link, {
                    kind: "drawer",
                    imageSource: image.getAttribute("src"),
                    text: primary.textContent
                });
            }
            if (image.getAttribute("src") !== logoUrl) {
                image.setAttribute("src", logoUrl);
            }
            image.classList.add("pft-brand-logo");
            if (primary.textContent !== "PunisherFin") {
                primary.textContent = "PunisherFin";
            }
            link.classList.add("pft-brand-drawer-link");
        });

        document.querySelectorAll(".pageTitleWithDefaultLogo").forEach(title => {
            if (!runtime.brandingElements.has(title)) {
                runtime.brandingElements.set(title, { kind: "legacy", text: title.textContent });
            }
            if (title.textContent !== "PunisherFin") {
                title.textContent = "PunisherFin";
            }
            title.style.setProperty("--pft-brand-logo", `url("${logoUrl}")`);
            title.classList.add("pft-brand-title");
        });
    }

    function markSupportedViews() {
        const config = runtime.config;
        const homeSections = document.querySelector(
            ".homeSectionsContainer, [data-testid='home-sections'], [class*='homeSectionsContainer']"
        );
        const markedHome = config?.enabled && config.home && visible(homeSections) ? homeSections : null;
        document.querySelectorAll(".pft-home-view").forEach(element => {
            if (element !== markedHome) {
                element.classList.remove("pft-home-view");
            }
        });
        markedHome?.classList.add("pft-home-view");

        const libraryViews = new Set();
        document.querySelectorAll(".page:not(.hide), .libraryPage:not(.hide)").forEach(page => {
            if (!config?.enabled
                || !config.libraries
                || !visible(page)
                || page.id === "itemDetailPage"
                || page.classList.contains("pluginConfigurationPage")
                || page.classList.contains("dashboardDocument")
                || page.querySelector(".homeSectionsContainer")
                || page.querySelector(".videoPlayerContainer")
                || !page.querySelector(".itemsContainer")) {
                return;
            }
            libraryViews.add(page);
        });
        document.querySelectorAll(".pft-library-view").forEach(element => {
            if (!libraryViews.has(element)) {
                element.classList.remove("pft-library-view");
            }
        });
        libraryViews.forEach(element => element.classList.add("pft-library-view"));
    }

    const transparentHeaderProperties = [
        "background",
        "background-color",
        "background-image",
        "backdrop-filter",
        "-webkit-backdrop-filter",
        "box-shadow"
    ];

    function syncTransparentHeader() {
        if (!runtime.config?.enabled) {
            return;
        }
        document.querySelectorAll(".skinHeader, .skinHeader-withBackground, .headerTop, .MuiAppBar-root, [class*='MuiAppBar-root'], header[class*='MuiPaper-elevation']").forEach(header => {
            if (!runtime.headerStyles.has(header)) {
                runtime.headerStyles.set(header, transparentHeaderProperties.map(property => ({
                    property,
                    value: header.style.getPropertyValue(property),
                    priority: header.style.getPropertyPriority(property)
                })));
            }
            transparentHeaderProperties.forEach(property => {
                const value = property === "background" || property === "background-color" ? "transparent" : "none";
                header.style.setProperty(property, value, "important");
            });
        });
    }

    function restoreTransparentHeader() {
        runtime.headerStyles.forEach((declarations, header) => {
            declarations.forEach(({ property, value, priority }) => {
                if (value) {
                    header.style.setProperty(property, value, priority);
                } else {
                    header.style.removeProperty(property);
                }
            });
        });
        runtime.headerStyles.clear();
    }

    function applyConfig(config) {
        runtime.config = config;
        root.classList.remove(...markerClasses);
        root.style.removeProperty("--pft-accent");
        root.style.removeProperty("--pft-accent-rgb");
        root.style.removeProperty("--pft-accent-soft");
        root.style.removeProperty("--pft-accent-strong");
        root.style.removeProperty("--pft-accent-contrast");
        root.style.removeProperty("--jf-palette-primary-mainChannel");
        root.style.removeProperty("--jf-palette-secondary-mainChannel");

        if (config?.enabled) {
            const accent = /^#[0-9a-f]{6}$/i.test(config.accent) ? config.accent : "#FF5F87";
            root.classList.add("pft-enabled");
            root.style.setProperty("--pft-accent", accent);
            root.style.setProperty("--pft-accent-rgb", accentChannel(accent));
            root.style.setProperty("--pft-accent-soft", `rgb(${accentChannel(accent)} / 22%)`);
            root.style.setProperty("--pft-accent-strong", `color-mix(in srgb, ${accent} 84%, #000)`);
            root.style.setProperty("--pft-accent-contrast", "#fff");
            root.style.setProperty("--jf-palette-primary-mainChannel", accentChannel(accent));
            root.style.setProperty("--jf-palette-secondary-mainChannel", accentChannel(accent));
            root.classList.toggle("pft-branding", config.branding === true);
            root.classList.toggle("pft-action-buttons", config.actionButtons === true);
            root.classList.toggle("pft-hide-episode-overview", config.episodeOverview === false);
            root.classList.toggle("pft-compact-episodes", config.compactEpisodes === true);
            root.classList.toggle("pft-card-previews", config.cardPreviews === true);
            root.classList.toggle("pft-video-previews", config.videoPreviews === true);
            root.classList.toggle("pft-player-controls", config.playerControls === true);
            root.classList.toggle("pft-random-background", config.randomBackground === true);
            syncTransparentHeader();
            syncBranding();
        } else {
            removeDesignStylesheet();
            root.removeAttribute("data-pft-design");
            restoreTransparentHeader();
            restoreBranding();
            restoreDetailButtonTitles();
        }

        if (config?.enabled !== true || config.videoPreviews !== true) {
            stopVideoPreview();
        }

        markSupportedViews();
        configureRandomBackground(config);
        syncDetailButtonLabels();
    }

    function cardId(card) {
        const direct = card?.dataset?.id || card?.dataset?.itemid || card?.getAttribute("data-itemid");
        if (direct) {
            return direct;
        }

        const link = card?.querySelector("a[href*='id='], a[href*='/details/']");
        const href = link?.getAttribute("href") || "";
        const queryMatch = href.match(/[?&#]id=([^&#]+)/i);
        if (queryMatch) {
            return decodeURIComponent(queryMatch[1]);
        }

        const pathMatch = href.match(/\/details\/([0-9a-f-]+)/i);
        return pathMatch ? pathMatch[1] : null;
    }

    function imageUrl(api, item) {
        const parameters = { maxWidth: 960, quality: 92 };
        if (item.Type === "Episode" && item.ImageTags?.Primary) {
            return api.getUrl(`/Items/${item.Id}/Images/Primary`, parameters);
        }
        if (item.BackdropImageTags?.length) {
            return api.getUrl(`/Items/${item.Id}/Images/Backdrop/0`, parameters);
        }
        if (item.ParentBackdropItemId) {
            return api.getUrl(`/Items/${item.ParentBackdropItemId}/Images/Backdrop/0`, parameters);
        }
        if (item.Type === "Season" && item.SeriesId) {
            return api.getUrl(`/Items/${item.SeriesId}/Images/Backdrop/0`, parameters);
        }
        return null;
    }

    function loadItem(id) {
        const api = jellyfinApi();
        const userId = api?.getCurrentUserId?.();
        if (!id || !api || !userId) {
            return Promise.resolve(null);
        }

        let request = runtime.previewCache.get(id);
        if (!request) {
            request = api.fetch({
                url: api.getUrl(`/Users/${userId}/Items/${id}`),
                type: "GET"
            }).then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }
                return response.json();
            }).catch(error => {
                console.debug("PunisherFinTheme: Mediendaten nicht verfügbar.", error);
                return null;
            });
            runtime.previewCache.set(id, request);
        }
        return request;
    }

    function currentDetailItemId() {
        const page = document.querySelector("#itemDetailPage:not(.hide)");
        const direct = page?.dataset?.id || page?.getAttribute("data-id");
        if (direct) {
            return direct;
        }
        const query = location.hash.includes("?") ? location.hash.split("?")[1] : location.search.slice(1);
        return new URLSearchParams(query).get("id");
    }

    function syncDetailButtonLabels() {
        if (!runtime.config?.enabled || runtime.config.actionButtons !== true) {
            return;
        }
        const buttons = document.querySelectorAll("#itemDetailPage:not(.hide) .mainDetailButtons .detailButton");
        if (!buttons.length) {
            return;
        }

        const id = currentDetailItemId();
        const savedMinutes = id ? runtime.resumeMinutes.get(id) : null;
        buttons.forEach(button => {
            const currentTitle = button.getAttribute("title");
            if (currentTitle) {
                button.dataset.pftTitle = currentTitle;
                button.setAttribute("aria-label", currentTitle);
                button.removeAttribute("title");
            }
            const content = button.querySelector(".detailButton-content");
            if (!content) {
                return;
            }
            let label = content.querySelector(".pft-detail-button-label");
            if (!label) {
                label = document.createElement("span");
                label.className = "pft-detail-button-label";
                content.appendChild(label);
            }
            const base = button.dataset.pftTitle || button.getAttribute("aria-label") || "";
            const language = document.documentElement.lang || navigator.language || "";
            const connector = language.toLowerCase().startsWith("de") ? "ab" : "at";
            const desired = button.classList.contains("btnPlay") && savedMinutes
                ? `${base} ${connector} ${savedMinutes}m`
                : base;
            if (label.textContent !== desired) {
                label.textContent = desired;
            }
        });

        if (!id || savedMinutes) {
            return;
        }
        void loadItem(id).then(item => {
            const ticks = item?.UserData?.PlaybackPositionTicks || 0;
            if (!ticks) {
                return;
            }
            const minutes = Math.max(1, Math.floor(ticks / 600000000));
            runtime.resumeMinutes.set(id, minutes);
            document.querySelectorAll("#itemDetailPage:not(.hide) .mainDetailButtons .btnPlay").forEach(button => {
                const label = button.querySelector(".pft-detail-button-label");
                const base = button.dataset.pftTitle || button.getAttribute("aria-label") || "";
                if (label && base) {
                    const language = document.documentElement.lang || navigator.language || "";
                    const connector = language.toLowerCase().startsWith("de") ? "ab" : "at";
                    const desired = `${base} ${connector} ${minutes}m`;
                    if (label.textContent !== desired) {
                        label.textContent = desired;
                    }
                }
            });
        });
    }

    function restoreDetailButtonTitles() {
        document.querySelectorAll("#itemDetailPage .mainDetailButtons .detailButton[data-pft-title]").forEach(button => {
            button.setAttribute("title", button.dataset.pftTitle);
            delete button.dataset.pftTitle;
            button.querySelector(".pft-detail-button-label")?.remove();
        });
    }

    function createPreview(card, url) {
        const imageHost = card.querySelector(".cardImageContainer, .cardContent");
        if (!imageHost || imageHost.querySelector(".pft-hover-artwork")) {
            return Promise.resolve(Boolean(card.classList.contains("pft-preview-ready")));
        }

        const image = document.createElement("img");
        image.className = "pft-hover-artwork";
        image.alt = "";
        image.decoding = "async";

        return new Promise(resolve => {
            image.addEventListener("load", () => {
                imageHost.appendChild(image);
                card.classList.add("pft-preview-ready");
                resolve(true);
            }, { once: true });
            image.addEventListener("error", () => resolve(false), { once: true });
            image.src = url;
        });
    }

    function firstEpisodeForPreview(api, item) {
        if (!["Series", "Season"].includes(item.Type)) {
            return Promise.resolve(item);
        }

        let request = runtime.previewVideoItemCache.get(item.Id);
        if (!request) {
            const userId = api.getCurrentUserId?.();
            request = userId ? api.fetch({
                url: api.getUrl("/Items", {
                    UserId: userId,
                    ParentId: item.Id,
                    Recursive: true,
                    IncludeItemTypes: "Episode",
                    SortBy: "ParentIndexNumber,IndexNumber",
                    SortOrder: "Ascending",
                    Limit: 1,
                    Fields: "RunTimeTicks",
                    EnableUserData: true,
                    EnableImages: false,
                    EnableTotalRecordCount: false
                }),
                type: "GET"
            }).then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }
                return response.json();
            }).then(result => (result.Items || result.items || [])[0] || null).catch(error => {
                console.debug("PunisherFinTheme: Keine Episode für die Videovorschau gefunden.", error);
                return null;
            }) : Promise.resolve(null);
            runtime.previewVideoItemCache.set(item.Id, request);
        }
        return request;
    }

    function previewStartTicks(item) {
        const duration = Math.max(0, Number(item.RunTimeTicks) || 0);
        const resume = Math.max(0, Number(item.UserData?.PlaybackPositionTicks) || 0);
        if (resume > 0 && (!duration || resume < duration * .9)) {
            return Math.floor(resume);
        }
        if (!duration) {
            return 600000000;
        }
        return Math.floor(Math.min(duration * .08, 1800000000));
    }

    function videoPreviewUrl(api, item) {
        const token = typeof api.accessToken === "function" ? api.accessToken() : api.accessToken;
        const parameters = {
            Static: false,
            VideoCodec: "h264",
            AudioCodec: "aac",
            VideoBitrate: 1200000,
            AudioBitrate: 64000,
            MaxAudioChannels: 2,
            Width: 640,
            Height: 360,
            StartTimeTicks: previewStartTicks(item),
            SubtitleStreamIndex: -1,
            EnableAutoStreamCopy: false,
            AllowVideoStreamCopy: false,
            AllowAudioStreamCopy: false
        };
        if (token) {
            parameters.ApiKey = token;
        }
        return api.getUrl(`/Videos/${item.Id}/stream.mp4`, parameters);
    }

    function stopVideoPreview(card) {
        window.clearTimeout(runtime.videoPreviewTimer);
        window.clearTimeout(runtime.previewClipTimer);
        runtime.videoPreviewTimer = null;
        runtime.previewClipTimer = null;
        runtime.previewVideoGeneration += 1;
        const video = runtime.activePreviewVideo;
        if (!video || (card && !card.contains(video))) {
            return;
        }
        runtime.activePreviewVideo = null;
        video.closest(".card")?.classList.remove("pft-preview-video-playing");
        try {
            video.pause();
            video.removeAttribute("src");
            video.load();
        } catch (error) {
            console.debug("PunisherFinTheme: Videovorschau konnte nicht vollständig beendet werden.", error);
        }
        video.remove();
    }

    async function startVideoPreview(card, item) {
        if (runtime.config?.videoPreviews !== true
                || runtime.activeCard !== card
                || !card.isConnected
                || !window.matchMedia("(hover: hover) and (pointer: fine), (min-width: 900px)").matches) {
            return;
        }
        stopVideoPreview();
        const generation = runtime.previewVideoGeneration;
        const api = jellyfinApi();
        const playable = api ? await firstEpisodeForPreview(api, item) : null;
        if (!playable || generation !== runtime.previewVideoGeneration || runtime.activeCard !== card || !card.isConnected) {
            return;
        }

        const imageHost = card.querySelector(".cardImageContainer, .cardContent");
        if (!imageHost) {
            return;
        }
        const video = document.createElement("video");
        video.className = "pft-preview-video";
        video.autoplay = true;
        video.controls = false;
        video.defaultMuted = true;
        video.muted = true;
        video.playsInline = true;
        video.preload = "metadata";
        video.disablePictureInPicture = true;
        video.setAttribute("muted", "");
        video.setAttribute("playsinline", "");
        video.addEventListener("playing", () => {
            if (runtime.activePreviewVideo !== video || runtime.activeCard !== card) {
                return;
            }
            card.classList.add("pft-preview-video-playing");
            runtime.previewClipTimer = window.setTimeout(() => stopVideoPreview(card), 12000);
        }, { once: true });
        video.addEventListener("error", () => {
            if (runtime.activePreviewVideo === video) {
                stopVideoPreview(card);
            }
        }, { once: true });
        runtime.activePreviewVideo = video;
        imageHost.appendChild(video);
        video.src = videoPreviewUrl(api, playable);
        video.load();
        try {
            await video.play();
        } catch (error) {
            if (runtime.activePreviewVideo === video) {
                console.debug("PunisherFinTheme: Browser hat die stumme Videovorschau abgelehnt.", error);
                stopVideoPreview(card);
            }
        }
    }

    async function preparePreview(card) {
        const id = cardId(card);
        const api = jellyfinApi();
        if (!id || !api) {
            return null;
        }
        const item = await loadItem(id);
        if (!item || !["Episode", "Movie", "Series", "Season", "Video"].includes(item.Type)) {
            return null;
        }
        card.classList.add("pft-media-preview-card");
        card.classList.toggle("pft-season-card", item.Type === "Season");
        const url = imageUrl(api, item);
        return url && await createPreview(card, url) ? item : null;
    }

    function previewCardFrom(target) {
        const card = target instanceof Element
            ? target.closest(".pft-home-view .card, #itemDetailPage:not(.hide) .card")
            : null;
        return card && root.classList.contains("pft-card-previews") ? card : null;
    }

    function openPreview(card) {
        window.clearTimeout(runtime.previewTimer);
        runtime.previewTimer = window.setTimeout(async () => {
            if (!card.isConnected) {
                return;
            }
            stopVideoPreview();
            runtime.activeCard?.classList.remove("pft-preview-expanded", "pft-preview-video-playing");
            runtime.activeCard = card;
            card.classList.add("pft-preview-loading");
            const previewItem = await preparePreview(card);
            card.classList.remove("pft-preview-loading");
            if (previewItem && runtime.activeCard === card) {
                card.classList.add("pft-preview-expanded");
                if (runtime.config?.videoPreviews === true) {
                    runtime.videoPreviewTimer = window.setTimeout(() => {
                        void startVideoPreview(card, previewItem);
                    }, 500);
                }
            }
        }, 140);
    }

    function closePreview(card) {
        window.clearTimeout(runtime.previewTimer);
        if (runtime.activeCard === card) {
            runtime.activeCard = null;
        }
        stopVideoPreview(card);
        card?.classList.remove("pft-preview-expanded", "pft-preview-loading", "pft-preview-video-playing");
    }

    function bindPreviewEvents() {
        document.addEventListener("pointerover", event => {
            if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
                return;
            }
            const card = previewCardFrom(event.target);
            if (card && !card.contains(event.relatedTarget)) {
                openPreview(card);
            }
        });
        document.addEventListener("pointerout", event => {
            const card = previewCardFrom(event.target);
            if (card && !card.contains(event.relatedTarget)) {
                closePreview(card);
            }
        });
        document.addEventListener("focusin", event => {
            const card = previewCardFrom(event.target);
            if (card) {
                openPreview(card);
            }
        });
        document.addEventListener("focusout", event => {
            const card = previewCardFrom(event.target);
            if (card && !card.contains(event.relatedTarget)) {
                closePreview(card);
            }
        });
    }

    function removeRandomBackground() {
        window.clearInterval(runtime.backgroundInterval);
        runtime.backgroundInterval = null;
        runtime.backgroundSignature = null;
        runtime.backgroundItems = [];
        runtime.lastBackgroundItem = null;
        runtime.backgroundGeneration += 1;
        runtime.backgroundContainer?.remove();
        runtime.backgroundContainer = null;
        [
            "--pft-bg-opacity",
            "--pft-bg-brightness",
            "--pft-bg-blur",
            "--pft-bg-saturation",
            "--pft-bg-contrast",
            "--pft-bg-crossfade",
            "--pft-bg-overlay-top",
            "--pft-bg-overlay-bottom"
        ].forEach(property => root.style.removeProperty(property));
    }

    function ensureBackgroundContainer() {
        if (runtime.backgroundContainer?.isConnected) {
            return runtime.backgroundContainer;
        }

        const container = document.createElement("div");
        container.id = "punisherFinRandomBackdrop";
        container.setAttribute("aria-hidden", "true");
        container.innerHTML = [
            '<div id="punisherFinBackdropLayer1" class="pft-backdrop-layer"></div>',
            '<div id="punisherFinBackdropLayer2" class="pft-backdrop-layer"></div>',
            '<div class="pft-backdrop-overlay"></div>'
        ].join("");
        const reactRoot = document.getElementById("reactRoot");
        if (reactRoot?.parentNode) {
            reactRoot.parentNode.insertBefore(container, reactRoot);
        } else {
            document.body.prepend(container);
        }
        runtime.backgroundContainer = container;
        return container;
    }

    function setBackgroundVariables(config) {
        const opacity = Math.max(0, Math.min(100, Number(config.backgroundOpacity) || 0)) / 100;
        const overlay = Math.max(0, Math.min(80, Number(config.backgroundOverlay) || 0)) / 100;
        root.style.setProperty("--pft-bg-opacity", String(opacity));
        root.style.setProperty("--pft-bg-brightness", `${Number(config.backgroundBrightness) || 68}%`);
        root.style.setProperty("--pft-bg-blur", `${Number(config.backgroundBlur) || 0}px`);
        root.style.setProperty("--pft-bg-saturation", `${Number(config.backgroundSaturation) || 100}%`);
        root.style.setProperty("--pft-bg-contrast", `${Number(config.backgroundContrast) || 100}%`);
        root.style.setProperty("--pft-bg-crossfade", `${Math.max(0, Number(config.backgroundCrossfade) || 0)}ms`);
        root.style.setProperty("--pft-bg-overlay-top", String(overlay * .5));
        root.style.setProperty("--pft-bg-overlay-bottom", String(Math.min(.95, overlay * 1.45)));
    }

    function anyVisible(selector) {
        return Array.from(document.querySelectorAll(selector)).some(element => visible(element));
    }

    function backgroundAllowedForCurrentView() {
        const playerActive = document.querySelector(".videoPlayerContainer-onTop")
            || anyVisible(".videoPlayerContainer:not(.hide), .videoPlayerContainer video");
        if (playerActive || anyVisible("#itemDetailPage:not(.hide)")) {
            return false;
        }
        return anyVisible(".pft-home-view, .pft-library-view, .dashboardDocument:not(.hide), .pluginConfigurationPage:not(.hide), #dashboardPage:not(.hide)");
    }

    function updateBackgroundVisibility() {
        runtime.backgroundContainer?.classList.toggle("pft-background-suspended", !backgroundAllowedForCurrentView());
    }

    async function resolveBackgroundLibrary(api, config) {
        const userId = api.getCurrentUserId?.();
        if (!userId) {
            return null;
        }
        const response = await api.getUserViews({ userId });
        const views = response?.Items || [];
        return views.find(view => String(view.Id).toLowerCase() === String(config.backgroundLibraryId || "").toLowerCase())
            || views.find(view => String(view.Name).toLowerCase() === String(config.backgroundLibraryName || "Anime").toLowerCase())
            || null;
    }

    async function loadBackgroundItems(api, libraryId) {
        const userId = api.getCurrentUserId?.();
        const options = {
            ParentId: libraryId,
            Recursive: true,
            IncludeItemTypes: "Series,Movie",
            Fields: "BackdropImageTags",
            Limit: 10000
        };
        if (typeof api.getItems === "function") {
            const result = await api.getItems(userId, options);
            return result?.Items || [];
        }
        const response = await api.fetch({ url: api.getUrl("/Items", { UserId: userId, ...options }), type: "GET" });
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        return (await response.json())?.Items || [];
    }

    function showNextRandomBackground(api, config) {
        if (!runtime.backgroundItems.length || !runtime.backgroundContainer?.isConnected) {
            return;
        }
        const alternatives = runtime.backgroundItems.length > 1
            ? runtime.backgroundItems.filter(item => item.Id !== runtime.lastBackgroundItem)
            : runtime.backgroundItems;
        const item = alternatives[Math.floor(Math.random() * alternatives.length)];
        const tags = item.BackdropImageTags || [];
        const index = Math.floor(Math.random() * tags.length);
        const imageUrl = api.getUrl(`/Items/${item.Id}/Images/Backdrop/${index}`, {
            quality: Math.max(30, Math.min(100, Number(config.backgroundQuality) || 90))
        });
        const preload = new Image();
        preload.decoding = "async";
        preload.addEventListener("load", () => {
            if (!runtime.backgroundContainer?.isConnected) {
                return;
            }
            const nextLayer = runtime.backgroundLayer === 0 ? 1 : 0;
            const layers = runtime.backgroundContainer.querySelectorAll(".pft-backdrop-layer");
            layers[nextLayer].style.backgroundImage = `url("${imageUrl.replaceAll('"', '%22')}")`;
            layers[nextLayer].classList.add("pft-backdrop-active");
            layers[runtime.backgroundLayer].classList.remove("pft-backdrop-active");
            runtime.backgroundLayer = nextLayer;
            runtime.lastBackgroundItem = item.Id;
        }, { once: true });
        preload.addEventListener("error", () => {
            console.debug("PunisherFinTheme: Ein Hintergrundbild konnte nicht geladen werden.");
        }, { once: true });
        preload.src = imageUrl;
    }

    async function startRandomBackground(api, config, generation) {
        try {
            const library = await resolveBackgroundLibrary(api, config);
            if (!library || generation !== runtime.backgroundGeneration) {
                if (!library) {
                    console.warn("PunisherFinTheme: Die gewählte Hintergrund-Bibliothek wurde nicht gefunden.");
                }
                return;
            }
            const items = (await loadBackgroundItems(api, library.Id)).filter(item => item.BackdropImageTags?.length);
            if (generation !== runtime.backgroundGeneration) {
                return;
            }
            runtime.backgroundItems = items;
            if (!items.length) {
                console.warn("PunisherFinTheme: In der Hintergrund-Bibliothek wurden keine backdrop.jpg-Bilder gefunden.");
                return;
            }
            showNextRandomBackground(api, config);
            runtime.backgroundInterval = window.setInterval(
                () => showNextRandomBackground(api, runtime.config || config),
                Math.max(10, Number(config.backgroundInterval) || 30) * 1000
            );
        } catch (error) {
            console.warn("PunisherFinTheme: Zufällige Hintergründe konnten nicht geladen werden.", error);
        }
    }

    function configureRandomBackground(config) {
        const api = jellyfinApi();
        if (!config?.enabled || config.randomBackground !== true || !api) {
            removeRandomBackground();
            return;
        }
        setBackgroundVariables(config);
        ensureBackgroundContainer();
        updateBackgroundVisibility();
        const signature = [
            api.getCurrentUserId?.(),
            config.backgroundLibraryId,
            config.backgroundLibraryName,
            config.backgroundInterval,
            config.backgroundQuality
        ].join("|");
        if (runtime.backgroundSignature === signature) {
            return;
        }
        window.clearInterval(runtime.backgroundInterval);
        runtime.backgroundInterval = null;
        runtime.backgroundItems = [];
        runtime.lastBackgroundItem = null;
        runtime.backgroundSignature = signature;
        const generation = ++runtime.backgroundGeneration;
        void startRandomBackground(api, config, generation);
    }

    async function loadConfig() {
        const api = jellyfinApi();
        if (!api || runtime.loading) {
            schedule(true);
            return;
        }

        runtime.loading = true;
        try {
            const response = await api.fetch({ url: api.getUrl("/PunisherFinTheme/config"), type: "GET" });
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            const config = await response.json();
            ensureStylesheet(api, config.version);
            applyConfig(config);
            ensureDesignStylesheet(api, config);
        } catch (error) {
            console.warn("PunisherFinTheme: Konfiguration konnte nicht geladen werden.", error);
            applyConfig(null);
        } finally {
            runtime.loading = false;
        }
    }

    function reconcile() {
        markSupportedViews();
        syncTransparentHeader();
        syncBranding();
        syncDetailButtonLabels();
        updateBackgroundVisibility();
    }

    function schedule(reloadConfig) {
        runtime.reloadRequested = runtime.reloadRequested || reloadConfig === true;
        if (runtime.timer !== null) {
            return;
        }
        runtime.timer = window.setTimeout(() => {
            runtime.timer = null;
            const shouldReload = runtime.reloadRequested;
            runtime.reloadRequested = false;
            if (shouldReload) {
                void loadConfig();
            } else {
                reconcile();
            }
        }, 120);
    }

    function start() {
        if (!document.body || !jellyfinApi()) {
            window.setTimeout(start, 100);
            return;
        }

        runtime.observer = new MutationObserver(() => schedule(false));
        runtime.observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["class"], characterData: true });
        document.addEventListener("viewshow", () => schedule(true));
        window.addEventListener("hashchange", () => schedule(true));
        window.addEventListener("popstate", () => schedule(true));
        window.addEventListener("pageshow", () => schedule(true));
        bindPreviewEvents();
        void loadConfig();
    }

    window[runtimeKey] = {
        refresh: loadConfig,
        reconcile: reconcile,
        stop: function () {
            runtime.observer?.disconnect();
            window.clearTimeout(runtime.timer);
            window.clearTimeout(runtime.previewTimer);
            closePreview(runtime.activeCard);
            removeRandomBackground();
            restoreTransparentHeader();
            restoreBranding();
            restoreDetailButtonTitles();
            root.style.removeProperty("--pft-accent");
            root.style.removeProperty("--pft-accent-rgb");
            root.style.removeProperty("--pft-accent-soft");
            root.style.removeProperty("--pft-accent-strong");
            root.style.removeProperty("--pft-accent-contrast");
            root.style.removeProperty("--jf-palette-primary-mainChannel");
            root.style.removeProperty("--jf-palette-secondary-mainChannel");
            root.classList.remove(...markerClasses);
            root.removeAttribute("data-pft-design");
            removeDesignStylesheet();
            document.querySelectorAll(".pft-home-view, .pft-library-view").forEach(element => {
                element.classList.remove(...pageClasses);
            });
        }
    };
    start();
}());
