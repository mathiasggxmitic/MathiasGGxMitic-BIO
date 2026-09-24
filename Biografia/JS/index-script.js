const HOME_URL = "https://mathiasggxmitic.it/";
const TRANSITION_PARAM = "transition";
const LANG_PARAM = "lang";
const SUPPORTED_LANGS = ["it", "en", "es"];
const DEFAULT_LANG = "it";
const LANG_STORAGE_KEY = "site-lang";
const CLOSE_MS = 420;

const menuBtn = document.getElementById("menu-btn");
const dropdownMenu = document.getElementById("dropdown-menu");
const chevron = document.getElementById("chevron");
const langBtn = document.getElementById("lang-btn");
const langDropdown = document.getElementById("lang-dropdown");
const langChevron = document.getElementById("lang-chevron");
const panelClose = document.getElementById("panel-close");
const transition = document.getElementById("page-transition");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
let navigationBusy = false;
let currentLang = DEFAULT_LANG;

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

function closeMenus() {
    dropdownMenu.classList.remove("active");
    chevron.classList.remove("open");
    langDropdown.classList.remove("active");
    langChevron.classList.remove("open");
}

menuBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    const open = dropdownMenu.classList.toggle("active");
    chevron.classList.toggle("open", open);
    langDropdown.classList.remove("active");
    langChevron.classList.remove("open");
});

langBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    const open = langDropdown.classList.toggle("active");
    langChevron.classList.toggle("open", open);
    dropdownMenu.classList.remove("active");
    chevron.classList.remove("open");
});

document.addEventListener("click", closeMenus);

document.querySelectorAll(".lang-option").forEach((option) => {
    option.addEventListener("click", async (event) => {
        event.preventDefault();
        event.stopPropagation();
        await setLanguage(option.dataset.lang);
        closeMenus();
    });
});

function getCloseRect() {
    const rect = panelClose.getBoundingClientRect();
    return { left: rect.left, top: rect.top, width: rect.width, height: rect.height, radius: rect.width / 2 };
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

async function closeBio() {
    if (navigationBusy) return;
    navigationBusy = true;
    closeMenus();
    const target = new URL(HOME_URL);
    target.searchParams.set(LANG_PARAM, currentLang);
    target.searchParams.set(TRANSITION_PARAM, "bio-to-home");
    prefetch(target.href);
    if (reduceMotion.matches) {
        window.location.assign(target.href);
        return;
    }
    const clip = getClip(getCloseRect());
    transition.hidden = false;
    transition.style.clipPath = "inset(0 0 0 0 round 0px)";
    transition.getBoundingClientRect();
    requestAnimationFrame(() => {
        transition.animate(
            [{ clipPath: "inset(0 0 0 0 round 0px)" }, { clipPath: clip }],
            { duration: CLOSE_MS, easing: "cubic-bezier(0.4, 0, 0.2, 1)", fill: "forwards" }
        ).finished.then(() => window.location.assign(target.href));
    });
}

panelClose.addEventListener("click", closeBio);

document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeBio();
});

function finishOpenTransition() {
    if (getQueryValue(TRANSITION_PARAM) !== "home-to-bio") return;
    const url = new URL(window.location.href);
    url.searchParams.delete(TRANSITION_PARAM);
    window.history.replaceState({}, "", url);
    document.documentElement.classList.add("transition-enter");
    if (reduceMotion.matches) {
        document.documentElement.classList.remove("transition-enter");
        return;
    }
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
    finishOpenTransition();
})();