(function () {
    "use strict";

    ["__punisherFinThemeV121", "__punisherFinThemeV130"].forEach(key => {
        window[key]?.stop?.();
        delete window[key];
    });
    const runtimeKey = "__punisherFinThemeV134";
    if (window[runtimeKey]) {
        return;
    }

    const root = document.documentElement;
    const markerClasses = ["pft-enabled", "pft-action-buttons", "pft-hide-episode-overview", "pft-compact-episodes", "pft-card-previews", "pft-player-controls", "pft-random-background"];
    const pageClasses = ["pft-home-view", "pft-library-view"];
    const runtime = {
        config: null,
        timer: null,
        reloadRequested: false,
        loading: false,
        stylesheet: null,
        observer: null,
        previewCache: new Map(),
        resumeMinutes: new Map(),
        previewTimer: null,
        activeCard: null,
        backgroundContainer: null,
        backgroundInterval: null,
        backgroundSignature: null,
        backgroundGeneration: 0,
        backgroundItems: [],
        backgroundLayer: 0,
        lastBackgroundItem: null
    };

    function jellyfinApi() {
        return window.ApiClient || (typeof ApiClient !== "undefined" ? ApiClient : null);
    }

    function visible(element) {
        return Boolean(element && element.isConnected && !element.classList.contains("hide") && element.getClientRects().length);
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

    function applyConfig(config) {
        runtime.config = config;
        root.classList.remove(...markerClasses);
        root.style.removeProperty("--pft-accent");

        if (config?.enabled) {
            root.classList.add("pft-enabled");
            root.style.setProperty("--pft-accent", /^#[0-9a-f]{6}$/i.test(config.accent) ? config.accent : "#FF5F87");
            root.classList.toggle("pft-action-buttons", config.actionButtons === true);
            root.classList.toggle("pft-hide-episode-overview", config.episodeOverview === false);
            root.classList.toggle("pft-compact-episodes", config.compactEpisodes === true);
            root.classList.toggle("pft-card-previews", config.cardPreviews === true);
            root.classList.toggle("pft-player-controls", config.playerControls === true);
            root.classList.toggle("pft-random-background", config.randomBackground === true);
        } else {
            restoreDetailButtonTitles();
        }

        configureRandomBackground(config);
        markSupportedViews();
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

    async function preparePreview(card) {
        const id = cardId(card);
        const api = jellyfinApi();
        if (!id || !api) {
            return false;
        }
        const item = await loadItem(id);
        const homeCard = Boolean(card.closest(".pft-home-view"));
        if (!item || (!homeCard && item.Type !== "Season") || !["Episode", "Movie", "Series", "Season", "Video"].includes(item.Type)) {
            return false;
        }
        card.classList.toggle("pft-season-card", item.Type === "Season");
        const url = imageUrl(api, item);
        return url ? createPreview(card, url) : false;
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
            runtime.activeCard?.classList.remove("pft-preview-expanded");
            runtime.activeCard = card;
            card.classList.add("pft-preview-loading");
            const ready = await preparePreview(card);
            card.classList.remove("pft-preview-loading");
            if (ready && runtime.activeCard === card) {
                card.classList.add("pft-preview-expanded");
            }
        }, 140);
    }

    function closePreview(card) {
        window.clearTimeout(runtime.previewTimer);
        if (runtime.activeCard === card) {
            runtime.activeCard = null;
        }
        card?.classList.remove("pft-preview-expanded", "pft-preview-loading");
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

    function backgroundHiddenForCurrentView() {
        const config = runtime.config;
        return Boolean(
            (config?.hideBackgroundOnDetails && visible(document.querySelector("#itemDetailPage:not(.hide)")))
            || (config?.hideBackgroundInPlayer && visible(document.querySelector(".videoPlayerContainer:not(.hide)")))
        );
    }

    function updateBackgroundVisibility() {
        runtime.backgroundContainer?.classList.toggle("pft-background-suspended", backgroundHiddenForCurrentView());
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
        } catch (error) {
            console.warn("PunisherFinTheme: Konfiguration konnte nicht geladen werden.", error);
            applyConfig(null);
        } finally {
            runtime.loading = false;
        }
    }

    function reconcile() {
        markSupportedViews();
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
        runtime.observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["class"] });
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
            restoreDetailButtonTitles();
            root.classList.remove(...markerClasses);
            document.querySelectorAll(".pft-home-view, .pft-library-view").forEach(element => {
                element.classList.remove(...pageClasses);
            });
        }
    };
    start();
}());
