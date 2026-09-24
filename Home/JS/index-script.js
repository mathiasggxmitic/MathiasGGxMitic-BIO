const HOME_URL = "https://mathiasggxmitic.it/";
const BIO_URL = "https://bio.mathiasggxmitic.it/";
const PROJECTS_URL = "https://projects.mathiasggxmitic.it/";
const TRANSITION_PARAM = "transition";
const LANG_PARAM = "lang";
const SUPPORTED_LANGS = ["it", "en", "es"];
const DEFAULT_LANG = "it";
const LANG_STORAGE_KEY = "site-lang";
const OPEN_MS = 560;

const langBtn = document.getElementById("lang-btn");
const langDropdown = document.getElementById("lang-dropdown");
const langChevron = document.getElementById("lang-chevron");
const transition = document.getElementById("page-transition");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
let currentLang = DEFAULT_LANG;
let navigationBusy = false;

function getQueryValue(name) {
    return new URL(window.location.href).searchParams.get(name);
}

function detectInitialLang() {
    const fromQuery = getQueryValue(LANG_PARAM);
    if (SUPPORTED_LANGS.includes(fromQuery)) return fromQuery;
    try {
        const saved = localStorage.getItem(LANG_STORAGE_KEY);
        if (SUPPORTED_LANGS.includes(saved)) return saved;
    } catch {}
    return DEFAULT_LANG;
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
    document.getElementById("lang-flag-current").textContent = dict.langFlag;
    document.getElementById("lang-code-current").textContent = dict.langCode;
    document.querySelectorAll("[data-i18n]").forEach((element) => {
        const key = element.dataset.i18n;
        if (dict[key] !== undefined) element.textContent = dict[key];
    });
    document.querySelectorAll("[data-i18n-attr]").forEach((element) => {
        element.dataset.i18nAttr.split(",").forEach((pair) => {
            const [attribute, key] = pair.split(":").map((value) => value.trim());
            if (attribute && dict[key] !== undefined) element.setAttribute(attribute, dict[key]);
        });
    });
    document.querySelectorAll(".lang-option").forEach((option) => {
        option.classList.toggle("active", option.dataset.lang === lang);
    });
}

async function setLanguage(lang, updateUrl = true) {
    const requested = SUPPORTED_LANGS.includes(lang) ? lang : DEFAULT_LANG;
    const dict = await loadLanguage(requested);
    currentLang = requested;
    applyTranslations(dict, requested);
    try { localStorage.setItem(LANG_STORAGE_KEY, requested); } catch {}
    if (updateUrl) {
        const url = new URL(window.location.href);
        url.searchParams.set(LANG_PARAM, requested);
        window.history.replaceState({}, "", url);
    }
}

function closeLanguageMenu() {
    langDropdown.classList.remove("active");
    langChevron.classList.remove("open");
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
        await setLanguage(option.dataset.lang);
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

function buildTarget(baseUrl, transitionName) {
    const target = new URL(baseUrl);
    target.searchParams.set(LANG_PARAM, currentLang);
    target.searchParams.set(TRANSITION_PARAM, transitionName);
    return target.href;
}

async function navigateToBio(tile) {
    if (navigationBusy) return;
    const icon = tile.querySelector(".app-icon");
    if (!icon) return;
    navigationBusy = true;
    closeLanguageMenu();
    const target = buildTarget(BIO_URL, "home-to-bio");
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
            [{ clipPath: clip }, { clipPath: "inset(0 0 0 0 round 0px)" }],
            { duration: OPEN_MS, easing: "cubic-bezier(0.32, 0.72, 0, 1)", fill: "forwards" }
        ).finished.then(() => window.location.assign(target));
    });
}

document.querySelectorAll(".app-tile").forEach((tile) => {
    tile.addEventListener("pointerenter", () => {
        if (tile.dataset.app === "bio") prefetch(buildTarget(BIO_URL, "home-to-bio"));
    });
    tile.addEventListener("focus", () => {
        if (tile.dataset.app === "bio") prefetch(buildTarget(BIO_URL, "home-to-bio"));
    });
    tile.addEventListener("click", () => {
        if (tile.dataset.app === "bio") {
            navigateToBio(tile);
            return;
        }
        if (tile.dataset.app === "projects") window.location.assign(PROJECTS_URL);
        if (tile.dataset.app === "soon") tile.querySelector(".app-icon")?.animate(
            [{ transform: "translateX(0)" }, { transform: "translateX(-6px)" }, { transform: "translateX(6px)" }, { transform: "translateX(-4px)" }, { transform: "translateX(4px)" }, { transform: "translateX(0)" }],
            { duration: 360, easing: "ease-in-out" }
        );
    });
});

function finishReturnTransition() {
    if (getQueryValue(TRANSITION_PARAM) !== "bio-to-home") return;
    const url = new URL(window.location.href);
    url.searchParams.delete(TRANSITION_PARAM);
    window.history.replaceState({}, "", url);
    document.documentElement.classList.add("transition-enter");
    requestAnimationFrame(() => {
        document.documentElement.classList.add("transition-ready");
        window.setTimeout(() => {
            document.documentElement.classList.remove("transition-enter", "transition-ready");
        }, 240);
    });
}

(async () => {
    try {
        await setLanguage(detectInitialLang());
    } catch {}
    finishReturnTransition();
})();