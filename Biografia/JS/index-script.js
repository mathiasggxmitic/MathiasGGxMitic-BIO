const menuBtn = document.getElementById("menu-btn");
const dropdownMenu = document.getElementById("dropdown-menu");
const chevron = document.getElementById("chevron");

const langBtn = document.getElementById("lang-btn");
const langDropdown = document.getElementById("lang-dropdown");
const langChevron = document.getElementById("lang-chevron");

if (menuBtn && dropdownMenu && chevron) {
    menuBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        const isOpen = dropdownMenu.classList.toggle("active");
        chevron.classList.toggle("open", isOpen);

        if (langDropdown && langChevron) {
            langDropdown.classList.remove("active");
            langChevron.classList.remove("open");
        }
    });
}

if (langBtn && langDropdown && langChevron) {
    langBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        const isOpen = langDropdown.classList.toggle("active");
        langChevron.classList.toggle("open", isOpen);

        if (dropdownMenu && chevron) {
            dropdownMenu.classList.remove("active");
            chevron.classList.remove("open");
        }
    });
}

document.addEventListener("click", () => {
    if (dropdownMenu && chevron) {
        dropdownMenu.classList.remove("active");
        chevron.classList.remove("open");
    }
    if (langDropdown && langChevron) {
        langDropdown.classList.remove("active");
        langChevron.classList.remove("open");
    }
});

/* ---------------------------------------------------
   Sistema di traduzione: una sola pagina, testi caricati
   dai file JSON in /languages per lingua.
--------------------------------------------------- */

const SUPPORTED_LANGS = ["it", "en", "es"];
const DEFAULT_LANG = "it";
const LANG_STORAGE_KEY = "site-lang";

const translationCache = {};

function detectInitialLang() {
    try {
        const saved = localStorage.getItem(LANG_STORAGE_KEY);
        if (saved && SUPPORTED_LANGS.includes(saved)) return saved;
    } catch (err) {
        /* localStorage non disponibile: si ignora e si usa il default */
    }

    const params = new URLSearchParams(window.location.search);
    const fromQuery = params.get("lang");
    if (fromQuery && SUPPORTED_LANGS.includes(fromQuery)) return fromQuery;

    return DEFAULT_LANG;
}

async function fetchTranslations(lang) {
    if (translationCache[lang]) return translationCache[lang];

    const response = await fetch(`languages/${lang}.json`);
    if (!response.ok) {
        throw new Error(`Impossibile caricare la traduzione per "${lang}"`);
    }
    const data = await response.json();
    translationCache[lang] = data;
    return data;
}

function applyTranslations(dict, lang) {
    document.getElementById("html-root").setAttribute("lang", dict.htmlLang || lang);

    const metaDescription = document.getElementById("meta-description");
    if (metaDescription) metaDescription.setAttribute("content", dict.metaDescription);

    document.querySelectorAll("[data-i18n]").forEach((el) => {
        const key = el.getAttribute("data-i18n");
        if (dict[key] !== undefined) el.textContent = dict[key];
    });

    document.querySelectorAll("[data-i18n-attr]").forEach((el) => {
        el.getAttribute("data-i18n-attr").split(",").forEach((pair) => {
            const [attr, key] = pair.split(":").map((s) => s.trim());
            if (attr && dict[key] !== undefined) el.setAttribute(attr, dict[key]);
        });
    });

    const flagEl = document.getElementById("lang-flag-current");
    const codeEl = document.getElementById("lang-code-current");
    if (flagEl) flagEl.textContent = dict.langFlag;
    if (codeEl) codeEl.textContent = dict.langCode;

    document.querySelectorAll(".lang-option").forEach((a) => {
        a.classList.toggle("active", a.getAttribute("data-lang") === lang);
    });
}

async function setLanguage(lang) {
    if (!SUPPORTED_LANGS.includes(lang)) lang = DEFAULT_LANG;

    try {
        const dict = await fetchTranslations(lang);
        applyTranslations(dict, lang);

        try {
            localStorage.setItem(LANG_STORAGE_KEY, lang);
        } catch (err) {
            /* localStorage non disponibile: la scelta semplicemente non persiste */
        }

        const url = new URL(window.location.href);
        url.searchParams.set("lang", lang);
        window.history.replaceState({}, "", url);
    } catch (err) {
        console.error(err);
    }
}

document.querySelectorAll(".lang-option").forEach((a) => {
    a.addEventListener("click", (e) => {
        e.preventDefault();
        const lang = a.getAttribute("data-lang");
        setLanguage(lang);
    });
});

setLanguage(detectInitialLang());