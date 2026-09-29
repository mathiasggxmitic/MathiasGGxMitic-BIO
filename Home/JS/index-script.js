const HOME_URL = "https://mathiasggxmitic.it/";
const BIO_URL = "https://bio.mathiasggxmitic.it/";
const PROJECTS_URL = "https://projects.mathiasggxmitic.it/";
const SUPPORTED_LANGS = ["it", "en", "es"];
const DEFAULT_LANG = "it";
const LANG_STORAGE_KEY = "site-lang";
const LANG_CODES = { it: "IT", en: "EN", es: "ES" };
const OPEN_MS = 560;

const root = document.documentElement;
const langBtn = document.getElementById("lang-btn");
const langDropdown = document.getElementById("lang-dropdown");
const langChevron = document.getElementById("lang-chevron");
const langFlagCurrent = document.getElementById("lang-flag-current");
const langCodeCurrent = document.getElementById("lang-code-current");
const transition = document.getElementById("page-transition");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

let currentLang = DEFAULT_LANG;
let navigationBusy = false;
let languageRequest = 0;

function detectInitialLang() {
    const pathLang = window.location.pathname.split("/").filter(Boolean)[0];
    if (SUPPORTED_LANGS.includes(pathLang)) return pathLang;

    try {
        const saved = localStorage.getItem(LANG_STORAGE_KEY);
        if (SUPPORTED_LANGS.includes(saved)) return saved;
    } catch {}

    return DEFAULT_LANG;
}

function renderLangButton(lang) {
    langFlagCurrent.src = `assets/flags/${lang}.svg`;
    langCodeCurrent.textContent = LANG_CODES[lang];
}

async function loadLanguage(lang) {
    const requested = SUPPORTED_LANGS.includes(lang) ? lang : DEFAULT_LANG;
    const response = await fetch(`lang/${requested}.json`, { cache: "no-store" });

    if (!response.ok) throw new Error(`Language file unavailable: ${requested}`);

    return response.json();
}

function applyTranslations(dict, lang) {
    document.documentElement.lang = dict.htmlLang || lang;
    document.getElementById("meta-description").content = dict.metaDescription;

    document.querySelectorAll("[data-i18n]").forEach((element) => {
        const key = element.dataset.i18n;
        if (dict[key] !== undefined) element.textContent = dict[key];
    });

    document.querySelectorAll("[data-i18n-attr]").forEach((element) => {
        element.dataset.i18nAttr.split(",").forEach((pair) => {
            const [attribute, key] = pair.split(":").map((value) => value.trim());

            if (attribute && dict[key] !== undefined) {
                element.setAttribute(attribute, dict[key]);
            }
        });
    });

    document.querySelectorAll(".lang-option").forEach((option) => {
        option.classList.toggle("active", option.dataset.lang === lang);
    });
}

async function setLanguage(lang, updateUrl = true) {
    const requested = SUPPORTED_LANGS.includes(lang) ? lang : DEFAULT_LANG;
    const requestId = ++languageRequest;
    const dict = await loadLanguage(requested);

    if (requestId !== languageRequest) return;

    currentLang = requested;
    renderLangButton(requested);
    applyTranslations(dict, requested);

    try {
        localStorage.setItem(LANG_STORAGE_KEY, requested);
    } catch {}

    if (updateUrl) {
        const url = new URL(window.location.href);
        url.pathname = `/${requested}`;
        window.history.replaceState({}, "", url);
    }
}

function closeLanguageMenu() {
    langDropdown.classList.remove("active");
    langChevron.classList.remove("open");
}

function resetTransitionState() {
    transition.getAnimations().forEach((animation) => animation.cancel());
    transition.style.clipPath = "";
    transition.hidden = true;
    root.classList.remove("transition-enter", "transition-ready");
    navigationBusy = false;
    closeLanguageMenu();
}

function syncFromHistory() {
    resetTransitionState();
    setLanguage(detectInitialLang(), false).catch(() => {});
}

langBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    const open = langDropdown.classList.toggle("active");
    langChevron.classList.toggle("open", open);
});

document.addEventListener("click", closeLanguageMenu);

document.querySelectorAll(".lang-option").forEach((option) => {
    option.addEventListener("click", async (event) => {
        event.preventDefault();
        event.stopPropagation();

        try {
            await setLanguage(option.dataset.lang);
        } catch {}

        closeLanguageMenu();
    });
});

function getIconRect(icon) {
    const rect = icon.getBoundingClientRect();

    return {
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
        radius: parseFloat(getComputedStyle(icon).borderTopLeftRadius) || 16
    };
}

function getClip(rect) {
    const right = window.innerWidth - rect.left - rect.width;
    const bottom = window.innerHeight - rect.top - rect.height;

    return `inset(${rect.top}px ${right}px ${bottom}px ${rect.left}px round ${rect.radius}px)`;
}

function prefetch(url) {
    if (document.querySelector(`link[data-prefetch-url="${CSS.escape(url)}"]`)) return;

    const link = document.createElement("link");
    link.rel = "prefetch";
    link.href = url;
    link.crossOrigin = "anonymous";
    link.dataset.prefetchUrl = url;
    document.head.appendChild(link);
}

function buildTarget(baseUrl) {
    const target = new URL(baseUrl);
    target.pathname = `/${currentLang}`;
    return target.href;
}

function navigateToBio(tile) {
    if (navigationBusy) return;

    const icon = tile.querySelector(".app-icon");
    if (!icon) return;

    navigationBusy = true;
    closeLanguageMenu();

    const target = buildTarget(BIO_URL);
    prefetch(target);

    if (reduceMotion.matches) {
        window.location.assign(target);
        return;
    }

    const clip = getClip(getIconRect(icon));

    transition.hidden = false;
    transition.style.clipPath = clip;
    transition.getBoundingClientRect();

    requestAnimationFrame(() => {
        transition.animate(
            [
                { clipPath: clip },
                { clipPath: "inset(0 0 0 0 round 0px)" }
            ],
            {
                duration: OPEN_MS,
                easing: "cubic-bezier(0.32, 0.72, 0, 1)",
                fill: "forwards"
            }
        ).finished.then(() => window.location.assign(target)).catch(() => {});
    });
}

document.querySelectorAll(".app-tile[data-app]").forEach((tile) => {
    tile.addEventListener("pointerenter", () => {
        if (tile.dataset.app === "bio") {
            prefetch(buildTarget(BIO_URL));
        }
    });

    tile.addEventListener("focus", () => {
        if (tile.dataset.app === "bio") {
            prefetch(buildTarget(BIO_URL));
        }
    });

    tile.addEventListener("click", () => {
        if (tile.dataset.app === "bio") {
            navigateToBio(tile);
            return;
        }

        if (tile.dataset.app === "projects") {
            window.location.assign(PROJECTS_URL);
            return;
        }

        if (tile.dataset.app === "soon") {
            tile.querySelector(".app-icon")?.animate(
                [
                    { transform: "translateX(0)" },
                    { transform: "translateX(-6px)" },
                    { transform: "translateX(6px)" },
                    { transform: "translateX(-4px)" },
                    { transform: "translateX(4px)" },
                    { transform: "translateX(0)" }
                ],
                {
                    duration: 360,
                    easing: "ease-in-out"
                }
            );
        }
    });
});

function finishReturnTransition() {
    if (!root.classList.contains("from-transition")) return;

    if (reduceMotion.matches) {
        root.classList.remove("transition-enter");
        return;
    }

    requestAnimationFrame(() => {
        root.classList.add("transition-ready");

        window.setTimeout(() => {
            root.classList.remove("transition-enter", "transition-ready");
        }, 240);
    });
}

window.addEventListener("pageshow", (event) => {
    if (event.persisted) syncFromHistory();
});

window.addEventListener("popstate", syncFromHistory);

async function init() {
    const lang = detectInitialLang();

    currentLang = lang;
    renderLangButton(lang);
    finishReturnTransition();

    try {
        await setLanguage(lang);
    } catch {
        if (lang !== DEFAULT_LANG) {
            try {
                await setLanguage(DEFAULT_LANG);
            } catch {}
        }
    } finally {
        root.classList.remove("is-loading");
    }
}

init();
