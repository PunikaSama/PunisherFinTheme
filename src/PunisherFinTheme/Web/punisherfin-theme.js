(function () {
    "use strict";

    const runtimeKey = "__punisherFinThemeV110";
    if (window[runtimeKey]) {
        return;
    }

    const root = document.documentElement;
    const markerClasses = ["pft-enabled", "pft-action-buttons", "pft-hide-episode-overview", "pft-compact-episodes", "pft-card-previews", "pft-player-controls"];
    const pageClasses = ["pft-home-view", "pft-library-view"];
    const runtime = {
        config: null,
        timer: null,
        reloadRequested: false,
        loading: false,
        stylesheet: null,
        observer: null,
        previewCache: new Map(),
        previewTimer: null,
        activeCard: null
    };

    function jellyfinApi() {
        return window.ApiClient || (typeof ApiClient !== "undefined" ? ApiClient : null);
    }

    function visible(element) {
        return Boolean(element && element.isConnected && !element.classList.contains("hide") && element.getClientRects().length);
    }

    function ensureStylesheet(api, version) {
        if (runtime.stylesheet?.isConnected) {
            return;
        }
        const link = document.createElement("link");
        link.id = "punisherfin-theme-styles";
        link.rel = "stylesheet";
        link.href = api.getUrl("/PunisherFinTheme/styles.css", { v: version || "1" });
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
        }

        markSupportedViews();
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
        return null;
    }

    function episodeLabel(item) {
        const season = Number.isInteger(item.ParentIndexNumber) ? `S${item.ParentIndexNumber}` : "";
        const episode = Number.isInteger(item.IndexNumber) ? `E${item.IndexNumber}` : "";
        return season && episode ? `${season}:${episode}` : season || episode;
    }

    function runtimeLabel(item) {
        if (!item.RunTimeTicks) {
            return "";
        }
        return `${Math.max(1, Math.round(item.RunTimeTicks / 600000000))} min`;
    }

    function createPreview(card, item, url) {
        const box = card.querySelector(".cardBox") || card;
        const imageHost = card.querySelector(".cardImageContainer, .cardContent");
        if (!imageHost || box.querySelector(":scope > .pft-hover-details")) {
            return Promise.resolve(Boolean(card.classList.contains("pft-preview-ready")));
        }

        const image = document.createElement("img");
        image.className = "pft-hover-artwork";
        image.alt = "";
        image.decoding = "async";

        const details = document.createElement("div");
        details.className = "pft-hover-details";

        const title = document.createElement("div");
        title.className = "pft-hover-title";
        title.textContent = item.SeriesName || item.Name || "";
        details.appendChild(title);

        const subtitleParts = [];
        const episode = episodeLabel(item);
        if (episode) {
            subtitleParts.push(episode);
        }
        if (item.Type === "Episode" && item.Name) {
            subtitleParts.push(item.Name);
        }
        if (item.ProductionYear) {
            subtitleParts.push(String(item.ProductionYear));
        }
        const duration = runtimeLabel(item);
        if (duration) {
            subtitleParts.push(duration);
        }
        if (subtitleParts.length) {
            const subtitle = document.createElement("div");
            subtitle.className = "pft-hover-meta";
            subtitle.textContent = subtitleParts.join(" · ");
            details.appendChild(subtitle);
        }

        if (item.Overview) {
            const overview = document.createElement("div");
            overview.className = "pft-hover-overview";
            overview.textContent = item.Overview;
            details.appendChild(overview);
        }

        return new Promise(resolve => {
            image.addEventListener("load", () => {
                imageHost.appendChild(image);
                box.appendChild(details);
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
        const userId = api?.getCurrentUserId?.();
        if (!id || !api || !userId) {
            return false;
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
                console.debug("PunisherFinTheme: Kartenvorschau nicht verfügbar.", error);
                return null;
            });
            runtime.previewCache.set(id, request);
        }

        const item = await request;
        if (!item || !["Episode", "Movie", "Series", "Video"].includes(item.Type)) {
            return false;
        }
        const url = imageUrl(api, item);
        return url ? createPreview(card, item, url) : false;
    }

    function previewCardFrom(target) {
        const card = target instanceof Element ? target.closest(".pft-home-view .card") : null;
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
            root.classList.remove(...markerClasses);
            document.querySelectorAll(".pft-home-view, .pft-library-view").forEach(element => {
                element.classList.remove(...pageClasses);
            });
        }
    };
    start();
}());
