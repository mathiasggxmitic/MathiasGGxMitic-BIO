/* ---------------------------------------------------
   Configurazione delle app
   Ogni app ha un indirizzo (url). Se url è null l'app non è ancora
   disponibile: cliccandola l'icona fa solo il "no" con la scossa.

   In produzione sostituisci gli indirizzi relativi con quelli dei
   sottodomini, ad esempio "https://bio.mathiasggxmitic.it".
--------------------------------------------------- */

const APPS = {
    bio: { url: "../Biografia/index.html" },
    projects: { url: null }
};

/* ---------------------------------------------------
   Elementi della pagina
--------------------------------------------------- */

const langBtn = document.getElementById("lang-btn");
const langDropdown = document.getElementById("lang-dropdown");
const langChevron = document.getElementById("lang-chevron");

const pageNavbar = document.getElementById("home-navbar");
const pageMain = document.getElementById("home-main");

const appWindow = document.getElementById("app-window");
const appFrame = document.getElementById("app-frame");
const appSplash = document.getElementById("app-splash");

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

/* ---------------------------------------------------
   Menu lingua
--------------------------------------------------- */

if (langBtn && langDropdown && langChevron) {
    langBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        const isOpen = langDropdown.classList.toggle("active");
        langChevron.classList.toggle("open", isOpen);
    });
}

document.addEventListener("click", () => {
    if (langDropdown && langChevron) {
        langDropdown.classList.remove("active");
        langChevron.classList.remove("open");
    }
});

/* ---------------------------------------------------
   Sistema di traduzione (stesso della bio):
   testi presi dall'oggetto TRANSLATIONS (JS/translations.js)
--------------------------------------------------- */

const SUPPORTED_LANGS = ["it", "en", "es"];
const DEFAULT_LANG = "it";
const LANG_STORAGE_KEY = "site-lang";

let currentLang = DEFAULT_LANG;

function detectInitialLang() {
    try {
        const params = new URLSearchParams(window.location.search);
        const fromQuery = params.get("lang");
        if (fromQuery && SUPPORTED_LANGS.includes(fromQuery)) return fromQuery;
    } catch (err) {
        /* URL non leggibile: si ignora */
    }

    try {
        const saved = localStorage.getItem(LANG_STORAGE_KEY);
        if (saved && SUPPORTED_LANGS.includes(saved)) return saved;
    } catch (err) {
        /* localStorage non disponibile: si usa il default */
    }

    return DEFAULT_LANG;
}

function applyTranslations(lang) {
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

/* fromApp = true quando la lingua è stata cambiata dentro la bio: in quel caso
   la bio è già nella lingua giusta e non serve ricaricarla. */
function setLanguage(lang, fromApp = false) {
    if (!SUPPORTED_LANGS.includes(lang)) lang = DEFAULT_LANG;

    currentLang = lang;
    applyTranslations(lang);

    try {
        localStorage.setItem(LANG_STORAGE_KEY, lang);
    } catch (err) {
        /* la scelta semplicemente non persiste */
    }

    try {
        const url = new URL(window.location.href);
        url.searchParams.set("lang", lang);
        window.history.replaceState({}, "", url);
    } catch (err) {
        /* URL non aggiornabile (es. file://): non è bloccante */
    }

    if (frameApp && APPS[frameApp]) {
        if (fromApp) {
            appFrame.dataset.url = frameUrl(APPS[frameApp]);
        } else if (!activeKey) {
            loadFrame(APPS[frameApp]);
        }
    }
}

document.querySelectorAll(".lang-option").forEach((a) => {
    a.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        setLanguage(a.getAttribute("data-lang"));
        langDropdown.classList.remove("active");
        langChevron.classList.remove("open");
    });
});

/* ---------------------------------------------------
   Caricamento dell'app nella finestra (iframe)
--------------------------------------------------- */

let frameApp = null;              /* app attualmente caricata nell'iframe */
let frameReady = Promise.resolve();

function frameUrl(app) {
    const url = new URL(app.url, window.location.href);
    url.searchParams.set("lang", currentLang);
    return url.href;
}

/* Carica l'app nell'iframe solo se serve (altra app o altra lingua) */
function loadFrame(app) {
    const url = frameUrl(app);
    if (appFrame.dataset.url === url) return frameReady;

    appFrame.dataset.url = url;
    frameReady = new Promise((resolve) => {
        appFrame.onload = () => resolve();
    });
    appFrame.src = url;
    return frameReady;
}

/* Precarica la bio in silenzio, così quando la apri è già pronta */
function warmUp(key) {
    const app = APPS[key];
    if (!app || !app.url || frameApp) return;
    frameApp = key;
    loadFrame(app);
}

/* ---------------------------------------------------
   Animazione di apertura / chiusura (stile macOS)

   La finestra è a schermo intero e viene "ritagliata" (clip-path):
   all'inizio il ritaglio coincide con l'icona cliccata, poi si
   espande fino a coprire tutto lo schermo. L'icona (splash) viaggia
   dalla sua posizione al centro. La chiusura fa il percorso inverso.
--------------------------------------------------- */

const OPEN_MS = 560;
const CLOSE_MS = 380;
const OPEN_EASE = "cubic-bezier(0.32, 0.72, 0, 1)";
const CLOSE_EASE = "cubic-bezier(0.4, 0, 0.2, 1)";
const FRAME_TIMEOUT_MS = 4000;

let activeKey = null;   /* app aperta (null = sei nella home) */
let activeTile = null;
let busy = false;       /* true mentre un'animazione è in corso */

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function setPageInert(on) {
    pageNavbar.inert = on;
    pageMain.inert = on;
}

function buildSplash(iconEl) {
    const clone = iconEl.cloneNode(true);
    appSplash.replaceChildren(clone);
    appSplash.style.marginLeft = -(iconEl.offsetWidth / 2) + "px";
    appSplash.style.marginTop = -(iconEl.offsetHeight / 2) + "px";
}

/* Misura dove si trova l'icona nella home "a riposo".
   Mentre l'app è aperta la home è rimpicciolita (scale rispetto al suo centro):
   invece di toccare gli stili si toglie quello zoom con un po' di matematica,
   così la misura è giusta anche se la transizione della home è ancora in corso. */
function measureIcon(iconEl) {
    const rect = iconEl.getBoundingClientRect();
    const mainRect = pageMain.getBoundingClientRect();
    const scale = new DOMMatrixReadOnly(getComputedStyle(pageMain).transform).a || 1;
    const originX = mainRect.left + mainRect.width / 2;
    const originY = mainRect.top + mainRect.height / 2;
    return {
        cx: originX + (rect.left + rect.width / 2 - originX) / scale,
        cy: originY + (rect.top + rect.height / 2 - originY) / scale,
        w: iconEl.offsetWidth,
        h: iconEl.offsetHeight,
        radius: parseFloat(getComputedStyle(iconEl).borderTopLeftRadius) || 16
    };
}

function playWindow(opening, iconEl) {
    if (reduceMotion.matches) {
        const fade = appWindow.animate(
            [{ opacity: opening ? 0 : 1 }, { opacity: opening ? 1 : 0 }],
            { duration: 150, fill: "both" }
        );
        return Promise.resolve([fade]);
    }

    const vw = appWindow.clientWidth;
    const vh = appWindow.clientHeight;
    const m = measureIcon(iconEl);
    const left = m.cx - m.w / 2;
    const top = m.cy - m.h / 2;

    const small = `inset(${top}px ${vw - left - m.w}px ${vh - top - m.h}px ${left}px round ${m.radius}px)`;
    const full = "inset(0px 0px 0px 0px round 0px)";
    const away = `translate(${m.cx - vw / 2}px, ${m.cy - vh / 2}px)`;
    const center = "translate(0px, 0px)";

    const timing = {
        duration: opening ? OPEN_MS : CLOSE_MS,
        easing: opening ? OPEN_EASE : CLOSE_EASE,
        fill: "both"
    };

    const windowAnim = appWindow.animate(
        opening ? [{ clipPath: small }, { clipPath: full }] : [{ clipPath: full }, { clipPath: small }],
        timing
    );
    const splashAnim = appSplash.animate(
        opening ? [{ transform: away }, { transform: center }] : [{ transform: center }, { transform: away }],
        timing
    );

    return Promise.all([windowAnim.finished, splashAnim.finished]).then(() => [windowAnim, splashAnim]);
}

function shake(tile) {
    if (reduceMotion.matches) return;
    const icon = tile.querySelector(".app-icon");
    icon.animate(
        [
            { transform: "translateX(0)" },
            { transform: "translateX(-7px)" },
            { transform: "translateX(7px)" },
            { transform: "translateX(-5px)" },
            { transform: "translateX(5px)" },
            { transform: "translateX(0)" }
        ],
        { duration: 380, easing: "ease-in-out" }
    );
}

async function openApp(key, tile) {
    if (busy || activeKey) return;

    const app = APPS[key];
    if (!app || !app.url) {
        shake(tile);
        return;
    }

    busy = true;
    activeKey = key;
    activeTile = tile;
    frameApp = key;

    const ready = loadFrame(app);
    appFrame.title = tile.querySelector(".app-label").textContent;

    const iconEl = tile.querySelector(".app-icon");
    buildSplash(iconEl);
    appSplash.classList.remove("is-hidden");
    appFrame.classList.remove("is-visible");

    appWindow.hidden = false;
    /* la misura dell'icona va presa prima di attivare lo zoom-out della home */
    const animation = playWindow(true, iconEl);
    document.body.classList.add("app-open");
    setPageInert(true);

    const anims = await animation;
    anims.forEach((a) => a.cancel());

    await Promise.race([ready, wait(FRAME_TIMEOUT_MS)]);

    appFrame.classList.add("is-visible");
    appSplash.classList.add("is-hidden");
    try {
        appFrame.contentWindow.focus();
    } catch (err) {
        /* in alcuni browser il focus sull'iframe può essere negato: non è bloccante */
    }
    busy = false;
}

async function closeApp() {
    if (!activeKey || busy) return;
    busy = true;

    const tile = activeTile;
    const iconEl = tile.querySelector(".app-icon");

    /* prima la bio sfuma e ricompare l'icona, poi la finestra si rimpicciolisce */
    appSplash.classList.remove("is-hidden");
    appFrame.style.transitionDuration = "0.12s";
    appFrame.classList.remove("is-visible");
    if (!reduceMotion.matches) await wait(130);

    const animation = playWindow(false, iconEl);
    document.body.classList.remove("app-open");
    const anims = await animation;

    appWindow.hidden = true;
    anims.forEach((a) => a.cancel());
    appFrame.style.transitionDuration = "";

    setPageInert(false);
    tile.focus({ preventScroll: true });

    activeKey = null;
    activeTile = null;
    busy = false;
}

/* ---------------------------------------------------
   Eventi
--------------------------------------------------- */

document.querySelectorAll(".app-tile").forEach((tile) => {
    tile.addEventListener("click", () => openApp(tile.getAttribute("data-app"), tile));
});

/* Esc chiude la finestra (quando il focus è nella home; dentro la bio lo gestisce la bio) */
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && activeKey) closeApp();
});

/* Messaggi dalla bio: chiusura col pulsante rosso e cambio lingua */
window.addEventListener("message", (event) => {
    if (event.source !== appFrame.contentWindow) return;
    const data = event.data;
    if (!data || typeof data !== "object") return;

    if (data.type === "app:close") {
        closeApp();
    } else if (data.type === "app:lang" && SUPPORTED_LANGS.includes(data.lang)) {
        setLanguage(data.lang, true);
    }
});

/* ---------------------------------------------------
   Avvio
--------------------------------------------------- */

setLanguage(detectInitialLang());
window.addEventListener("load", () => setTimeout(() => warmUp("bio"), 300));
