const APPS = {
    bio: {
        url: "https://bio.mathiasggxmitic.it/"
    },
    projects: {
        url: "https://projects.mathiasggxmitic.it/"
    }
};

const BIO_URL = APPS.bio.url;
const HOME_URL = "https://mathiasggxmitic.it/";
const TRANSITION_PARAM = "transition";

const langBtn = document.getElementById("lang-btn");
const langDropdown = document.getElementById("lang-dropdown");
const langChevron = document.getElementById("lang-chevron");
const transition = document.getElementById("page-transition");
const transitionIcon = document.getElementById("transition-icon");
const pageMain = document.getElementById("home-main");
const pageNavbar = document.getElementById("home-navbar");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

const SUPPORTED_LANGS = ["it", "en", "es"];
const DEFAULT_LANG = "it";
const LANG_STORAGE_KEY = "site-lang";

let currentLang = DEFAULT_LANG;
let navigationBusy = false;

function detectInitialLang() {
    try {
        const params = new URLSearchParams(window.location.search);
        const fromQuery = params.get("lang");

        if (fromQuery && SUPPORTED_LANGS.includes(fromQuery)) {
            return fromQuery;
        }
    } catch {}

    try {
        const saved = localStorage.getItem(LANG_STORAGE_KEY);

        if (saved && SUPPORTED_LANGS.includes(saved)) {
            return saved;
        }
    } catch {}

    return DEFAULT_LANG;
}

function applyTranslations(lang) {
    const dict = TRANSLATIONS[lang];

    if (!dict) {
        return;
    }

    const htmlRoot = document.getElementById("html-root");
    const metaDescription = document.getElementById("meta-description");
    const flagEl = document.getElementById("lang-flag-current");
    const codeEl = document.getElementById("lang-code-current");

    if (htmlRoot) {
        htmlRoot.setAttribute("lang", dict.htmlLang || lang);
    }

    if (metaDescription) {
        metaDescription.setAttribute("content", dict.metaDescription);
    }

    if (flagEl) {
        flagEl.textContent = dict.langFlag;
    }

    if (codeEl) {
        codeEl.textContent = dict.langCode;
    }

    document.querySelectorAll("[data-i18n]").forEach((el) => {
        const key = el.getAttribute("data-i18n");

        if (dict[key] !== undefined) {
            el.textContent = dict[key];
        }
    });

    document.querySelectorAll("[data-i18n-attr]").forEach((el) => {
        el.getAttribute("data-i18n-attr").split(",").forEach((pair) => {
            const [attr, key] = pair.split(":").map((value) => value.trim());

            if (attr && dict[key] !== undefined) {
                el.setAttribute(attr, dict[key]);
            }
        });
    });

    document.querySelectorAll(".lang-option").forEach((option) => {
        option.classList.toggle(
            "active",
            option.getAttribute("data-lang") === lang
        );
    });
}

function setLanguage(lang) {
    if (!SUPPORTED_LANGS.includes(lang)) {
        lang = DEFAULT_LANG;
    }

    currentLang = lang;
    applyTranslations(lang);

    try {
        localStorage.setItem(LANG_STORAGE_KEY, lang);
    } catch {}

    try {
        const url = new URL(window.location.href);
        url.searchParams.set("lang", lang);
        window.history.replaceState({}, "", url);
    } catch {}
}

function closeLanguageMenu() {
    if (!langDropdown || !langChevron) {
        return;
    }

    langDropdown.classList.remove("active");
    langChevron.classList.remove("open");
}

if (langBtn && langDropdown && langChevron) {
    langBtn.addEventListener("click", (event) => {
        event.stopPropagation();

        const isOpen = langDropdown.classList.toggle("active");

        langChevron.classList.toggle("open", isOpen);
    });
}

document.addEventListener("click", closeLanguageMenu);

document.querySelectorAll(".lang-option").forEach((option) => {
    option.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();

        setLanguage(option.getAttribute("data-lang"));
        closeLanguageMenu();
    });
});

function getTransitionState() {
    try {
        return new URL(window.location.href).searchParams.get(TRANSITION_PARAM);
    } catch {
        return null;
    }
}

function clearTransitionState() {
    try {
        const url = new URL(window.location.href);

        url.searchParams.delete(TRANSITION_PARAM);

        window.history.replaceState({}, "", url);
    } catch {}
}

function getIconRect(icon) {
    const rect = icon.getBoundingClientRect();

    return {
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
        radius: parseFloat(
            getComputedStyle(icon).borderTopLeftRadius
        ) || 16
    };
}

function getTransitionClip(rect) {
    const right =
        window.innerWidth -
        rect.left -
        rect.width;

    const bottom =
        window.innerHeight -
        rect.top -
        rect.height;

    return `inset(${rect.top}px ${right}px ${bottom}px ${rect.left}px round ${rect.radius}px)`;
}

function createTransitionIcon(icon) {
    transitionIcon.replaceChildren(icon.cloneNode(true));

    transitionIcon.style.width = `${icon.offsetWidth}px`;
    transitionIcon.style.height = `${icon.offsetHeight}px`;
}

async function navigateToBio(tile) {
    if (navigationBusy) {
        return;
    }

    const icon = tile.querySelector(".app-icon");

    if (!icon) {
        return;
    }

    navigationBusy = true;

    closeLanguageMenu();

    const rect = getIconRect(icon);

    createTransitionIcon(icon);

    const target = new URL(BIO_URL);

    target.searchParams.set("lang", currentLang);
    target.searchParams.set(
        TRANSITION_PARAM,
        "home-to-bio"
    );

    if (reduceMotion.matches) {
        window.location.assign(target.href);
        return;
    }

    transition.hidden = false;
    transition.classList.add("is-active");
    transition.style.clipPath = getTransitionClip(rect);

    pageMain.classList.add("is-transitioning");
    pageNavbar.classList.add("is-transitioning");

    await transition.animate(
        [
            {
                clipPath: getTransitionClip(rect)
            },
            {
                clipPath: "inset(0 0 0 0 round 0px)"
            }
        ],
        {
            duration: 560,
            easing: "cubic-bezier(0.32, 0.72, 0, 1)",
            fill: "forwards"
        }
    ).finished;

    window.location.assign(target.href);
}

document.querySelectorAll(".app-tile").forEach((tile) => {
    tile.addEventListener("click", () => {
        const app = tile.getAttribute("data-app");

        if (app === "bio") {
            navigateToBio(tile);
            return;
        }

        if (app === "projects") {
            if (APPS.projects.url) {
                window.location.assign(APPS.projects.url);
            }

            return;
        }

        const icon = tile.querySelector(".app-icon");

        if (icon) {
            icon.animate(
                [
                    {
                        transform: "translateX(0)"
                    },
                    {
                        transform: "translateX(-6px)"
                    },
                    {
                        transform: "translateX(6px)"
                    },
                    {
                        transform: "translateX(-4px)"
                    },
                    {
                        transform: "translateX(4px)"
                    },
                    {
                        transform: "translateX(0)"
                    }
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
    const state = getTransitionState();

    if (state !== "bio-to-home") {
        return;
    }

    clearTransitionState();

    if (!transition || !transitionIcon) {
        return;
    }

    transition.hidden = false;
    transition.classList.add("is-active");
    transition.style.clipPath =
        "inset(0 0 0 0 round 0px)";

    transitionIcon.classList.add("is-hidden");

    requestAnimationFrame(() => {
        transition.animate(
            [
                {
                    opacity: 1
                },
                {
                    opacity: 0
                }
            ],
            {
                duration: 220,
                easing: "ease-out",
                fill: "forwards"
            }
        ).finished.then(() => {
            transition.hidden = true;
            transition.classList.remove("is-active");
            transitionIcon.classList.remove("is-hidden");
        });
    });
}

setLanguage(detectInitialLang());
finishReturnTransition();