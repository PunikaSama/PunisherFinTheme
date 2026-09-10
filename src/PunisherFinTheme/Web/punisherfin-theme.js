(function () {
    "use strict";

    const runtimeKey = "__punisherFinThemeV100";
    if (window[runtimeKey]) {
        return;
    }

    const root = document.documentElement;
    const markerClasses = ["pft-enabled", "pft-action-buttons", "pft-hide-episode-overview", "pft-compact-episodes"];
    const pageClasses = ["pft-home-view", "pft-library-view"];
    const runtime = {
        config: null,
        timer: null,
        reloadRequested: false,
        loading: false,
        stylesheet: null,
        observer: null
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
        }

        markSupportedViews();
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
        void loadConfig();
    }

    window[runtimeKey] = {
        refresh: loadConfig,
        reconcile: reconcile,
        stop: function () {
            runtime.observer?.disconnect();
            window.clearTimeout(runtime.timer);
            root.classList.remove(...markerClasses);
            document.querySelectorAll(".pft-home-view, .pft-library-view").forEach(element => {
                element.classList.remove(...pageClasses);
            });
        }
    };
    start();
}());
