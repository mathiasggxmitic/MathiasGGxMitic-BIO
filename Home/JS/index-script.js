const APPS = {
    bio: {
        url: "https://bio.mathiasggxmitic.it/"
    },
    projects: {
        url: "https://projects.mathiasggxmitic.it/"
    }
};

const langBtn = document.getElementById("lang-btn");
const langDropdown = document.getElementById("lang-dropdown");
const langChevron = document.getElementById("lang-chevron");

const pageNavbar = document.getElementById("home-navbar");
const pageMain = document.getElementById("home-main");

const appWindow = document.getElementById("app-window");
const appFrame = document.getElementById("app-frame");
const appSplash = document.getElementById("app-splash");

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

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

const SUPPORTED_LANGS = ["it", "en", "es"];
const DEFAULT_LANG = "it";
const LANG_STORAGE_KEY = "site-lang";

let currentLang = DEFAULT_LANG;

function detectInitialLang() {
    try {
        const params = new URLSearchParams(window.location.search);
        const fromQuery = params.get("lang");

        if (fromQuery && SUPPORTED_LANGS.includes(fromQuery)) {
            return fromQuery;
        }
    } catch (err) {
    }

    try {
        const saved = localStorage.getItem(LANG_STORAGE_KEY);

        if (saved && SUPPORTED_LANGS.includes(saved)) {
            return saved;
        }
    } catch (err) {
    }

    return DEFAULT_LANG;
}

function applyTranslations(lang) {
    const dict = TRANSLATIONS[lang];

    if (!dict) {
        return;
    }

    const htmlRoot = document.getElementById("html-root");

    if (htmlRoot) {
        htmlRoot.setAttribute("lang", dict.htmlLang || lang);
    }

    const metaDescription = document.getElementById("meta-description");

    if (metaDescription) {
        metaDescription.setAttribute("content", dict.metaDescription);
    }

    document.querySelectorAll("[data-i18n]").forEach((el) => {
        const key = el.getAttribute("data-i18n");

        if (dict[key] !== undefined) {
            el.textContent = dict[key];
        }
    });

    document.querySelectorAll("[data-i18n-attr]").forEach((el) => {
        el.getAttribute("data-i18n-attr").split(",").forEach((pair) => {
            const [attr, key] = pair.split(":").map((s) => s.trim());

            if (attr && dict[key] !== undefined) {
                el.setAttribute(attr, dict[key]);
            }
        });
    });

    const flagEl = document.getElementById("lang-flag-current");
    const codeEl = document.getElementById("lang-code-current");

    if (flagEl) {
        flagEl.textContent = dict.langFlag;
    }

    if (codeEl) {
        codeEl.textContent = dict.langCode;
    }

    document.querySelectorAll(".lang-option").forEach((a) => {
        a.classList.toggle(
            "active",
            a.getAttribute("data-lang") === lang
        );
    });
}

function setLanguage(lang, fromApp = false) {
    if (!SUPPORTED_LANGS.includes(lang)) {
        lang = DEFAULT_LANG;
    }

    currentLang = lang;

    applyTranslations(lang);

    try {
        localStorage.setItem(LANG_STORAGE_KEY, lang);
    } catch (err) {
    }

    try {
        const url = new URL(window.location.href);

        url.searchParams.set("lang", lang);

        window.history.replaceState({}, "", url);
    } catch (err) {
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

let frameApp = null;
let frameReady = Promise.resolve();

function frameUrl(app) {
    const url = new URL(app.url, window.location.href);

    url.searchParams.set("lang", currentLang);

    return url.href;
}

function loadFrame(app) {
    const url = frameUrl(app);

    if (appFrame.dataset.url === url) {
        return frameReady;
    }

    appFrame.dataset.url = url;

    frameReady = new Promise((resolve) => {
        appFrame.onload = () => resolve();
    });

    appFrame.src = url;

    return frameReady;
}

function warmUp(key) {
    const app = APPS[key];

    if (!app || !app.url || frameApp) {
        return;
    }

    frameApp = key;

    loadFrame(app);
}

const OPEN_MS = 560;
const CLOSE_MS = 380;
const OPEN_EASE = "cubic-bezier(0.32, 0.72, 0, 1)";
const CLOSE_EASE = "cubic-bezier(0.4, 0, 0.2, 1)";
const FRAME_TIMEOUT_MS = 4000;

let activeKey = null;
let activeTile = null;
let busy = false;

const wait = (ms) => new Promise((resolve) => {
    setTimeout(resolve, ms);
});

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

function measureIcon(iconEl) {
    const rect = iconEl.getBoundingClientRect();
    const mainRect = pageMain.getBoundingClientRect();

    const scale =
        new DOMMatrixReadOnly(
            getComputedStyle(pageMain).transform
        ).a || 1;

    const originX = mainRect.left + mainRect.width / 2;
    const originY = mainRect.top + mainRect.height / 2;

    return {
        cx:
            originX +
            (rect.left + rect.width / 2 - originX) /
            scale,

        cy:
            originY +
            (rect.top + rect.height / 2 - originY) /
            scale,

        w: iconEl.offsetWidth,
        h: iconEl.offsetHeight,

        radius:
            parseFloat(
                getComputedStyle(iconEl).borderTopLeftRadius
            ) || 16
    };
}

function playWindow(opening, iconEl) {
    if (reduceMotion.matches) {
        const fade = appWindow.animate(
            [
                {
                    opacity: opening ? 0 : 1
                },
                {
                    opacity: opening ? 1 : 0
                }
            ],
            {
                duration: 150,
                fill: "both"
            }
        );

        return Promise.resolve([fade]);
    }

    const vw = appWindow.clientWidth;
    const vh = appWindow.clientHeight;
    const m = measureIcon(iconEl);

    const left = m.cx - m.w / 2;
    const top = m.cy - m.h / 2;

    const small =
        `inset(${top}px ${vw - left - m.w}px ` +
        `${vh - top - m.h}px ${left}px round ${m.radius}px)`;

    const full = "inset(0px 0px 0px 0px round 0px)";

    const away =
        `translate(${m.cx - vw / 2}px, ${m.cy - vh / 2}px)`;

    const center = "translate(0px, 0px)";

    const timing = {
        duration: opening ? OPEN_MS : CLOSE_MS,
        easing: opening ? OPEN_EASE : CLOSE_EASE,
        fill: "both"
    };

    const windowAnim = appWindow.animate(
        opening
            ? [
                {
                    clipPath: small
                },
                {
                    clipPath: full
                }
            ]
            : [
                {
                    clipPath: full
                },
                {
                    clipPath: small
                }
            ],
        timing
    );

    const splashAnim = appSplash.animate(
        opening
            ? [
                {
                    transform: away
                },
                {
                    transform: center
                }
            ]
            : [
                {
                    transform: center
                },
                {
                    transform: away
                }
            ],
        timing
    );

    return Promise.all([
        windowAnim.finished,
        splashAnim.finished
    ]).then(() => [
        windowAnim,
        splashAnim
    ]);
}

function shake(tile) {
    if (reduceMotion.matches) {
        return;
    }

    const icon = tile.querySelector(".app-icon");

    icon.animate(
        [
            {
                transform: "translateX(0)"
            },
            {
                transform: "translateX(-7px)"
            },
            {
                transform: "translateX(7px)"
            },
            {
                transform: "translateX(-5px)"
            },
            {
                transform: "translateX(5px)"
            },
            {
                transform: "translateX(0)"
            }
        ],
        {
            duration: 380,
            easing: "ease-in-out"
        }
    );
}

async function openApp(key, tile) {
    if (busy || activeKey) {
        return;
    }

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

    appFrame.title =
        tile.querySelector(".app-label").textContent;

    const iconEl = tile.querySelector(".app-icon");

    buildSplash(iconEl);

    appSplash.classList.remove("is-hidden");
    appFrame.classList.remove("is-visible");

    appWindow.hidden = false;

    const animation = playWindow(true, iconEl);

    document.body.classList.add("app-open");
    setPageInert(true);

    const anims = await animation;

    anims.forEach((a) => a.cancel());

    await Promise.race([
        ready,
        wait(FRAME_TIMEOUT_MS)
    ]);

    appFrame.classList.add("is-visible");
    appSplash.classList.add("is-hidden");

    try {
        appFrame.contentWindow.focus();
    } catch (err) {
    }

    busy = false;
}

async function closeApp() {
    if (!activeKey || busy) {
        return;
    }

    busy = true;

    const tile = activeTile;
    const iconEl = tile.querySelector(".app-icon");

    appSplash.classList.remove("is-hidden");

    appFrame.style.transitionDuration = "0.12s";
    appFrame.classList.remove("is-visible");

    if (!reduceMotion.matches) {
        await wait(130);
    }

    const animation = playWindow(false, iconEl);

    document.body.classList.remove("app-open");

    const anims = await animation;

    appWindow.hidden = true;

    anims.forEach((a) => a.cancel());

    appFrame.style.transitionDuration = "";

    setPageInert(false);

    tile.focus({
        preventScroll: true
    });

    activeKey = null;
    activeTile = null;
    busy = false;
}

document.querySelectorAll(".app-tile").forEach((tile) => {
    tile.addEventListener("click", () => {
        openApp(
            tile.getAttribute("data-app"),
            tile
        );
    });
});

document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && activeKey) {
        closeApp();
    }
});

window.addEventListener("message", (event) => {
    if (event.source !== appFrame.contentWindow) {
        return;
    }

    const trustedBioOrigins = [
        "https://bio.mathiasggxmitic.it",
        "http://localhost",
        "http://127.0.0.1",
        "null"
    ];

    const isTrustedOrigin =
        trustedBioOrigins.includes(event.origin) ||
        (
            window.location.protocol === "file:" &&
            event.origin === "null"
        );

    if (!isTrustedOrigin) {
        return;
    }

    const data = event.data;

    if (!data || typeof data !== "object") {
        return;
    }

    if (data.type === "app:close") {
        closeApp();
    } else if (
        data.type === "app:lang" &&
        SUPPORTED_LANGS.includes(data.lang)
    ) {
        setLanguage(data.lang, true);
    }
});

setLanguage(detectInitialLang());

window.addEventListener("load", () => {
    setTimeout(() => {
        warmUp("bio");
    }, 300);
});