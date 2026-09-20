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
   Sistema di traduzione: una sola pagina, testi presi
   dall'oggetto TRANSLATIONS (JS/translations.js).
   Niente fetch: funziona anche aprendo il file in locale.
--------------------------------------------------- */

const SUPPORTED_LANGS = ["it", "en", "es"];
const DEFAULT_LANG = "it";
const LANG_STORAGE_KEY = "site-lang";

function detectInitialLang() {
    try {
        const saved = localStorage.getItem(LANG_STORAGE_KEY);
        if (saved && SUPPORTED_LANGS.includes(saved)) return saved;
    } catch (err) {
        /* localStorage non disponibile: si ignora e si usa il default */
    }

    try {
        const params = new URLSearchParams(window.location.search);
        const fromQuery = params.get("lang");
        if (fromQuery && SUPPORTED_LANGS.includes(fromQuery)) return fromQuery;
    } catch (err) {
        /* URL non leggibile: si ignora */
    }

    return DEFAULT_LANG;
}

function applyTranslations(lang) {
    if (!SUPPORTED_LANGS.includes(lang)) lang = DEFAULT_LANG;
    const dict = TRANSLATIONS[lang];
    if (!dict) return;

    const htmlRoot = document.getElementById("html-root");
    if (htmlRoot) htmlRoot.setAttribute("lang", dict.htmlLang || lang);

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

function setLanguage(lang) {
    if (!SUPPORTED_LANGS.includes(lang)) lang = DEFAULT_LANG;

    applyTranslations(lang);

    try {
        localStorage.setItem(LANG_STORAGE_KEY, lang);
    } catch (err) {
        /* localStorage non disponibile: la scelta semplicemente non persiste */
    }

    try {
        const url = new URL(window.location.href);
        url.searchParams.set("lang", lang);
        window.history.replaceState({}, "", url);
    } catch (err) {
        /* URL non aggiornabile (es. protocollo file://): non è bloccante */
    }
}

document.querySelectorAll(".lang-option").forEach((a) => {
    a.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        const lang = a.getAttribute("data-lang");
        setLanguage(lang);
        if (langDropdown && langChevron) {
            langDropdown.classList.remove("active");
            langChevron.classList.remove("open");
        }
    });
});

setLanguage(detectInitialLang());