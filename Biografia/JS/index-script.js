const HOME_URL = "https://mathiasggxmitic.it/";
const TRANSITION_PARAM = "transition";

const menuBtn = document.getElementById("menu-btn");
const dropdownMenu = document.getElementById("dropdown-menu");
const chevron = document.getElementById("chevron");

const langBtn = document.getElementById("lang-btn");
const langDropdown = document.getElementById("lang-dropdown");
const langChevron = document.getElementById("lang-chevron");

const panelClose = document.getElementById("panel-close");
const transition = document.getElementById("page-transition");
const transitionIcon = document.getElementById("transition-icon");

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

const SUPPORTED_LANGS = ["it", "en", "es"];
const DEFAULT_LANG = "it";
const LANG_STORAGE_KEY = "site-lang";

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
    if (!SUPPORTED_LANGS.includes(lang)) {
        lang = DEFAULT_LANG;
    }

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
            const [attr, key] = pair
                .split(":")
                .map((value) => value.trim());

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

function closeMenus() {
    if (dropdownMenu && chevron) {
        dropdownMenu.classList.remove("active");
        chevron.classList.remove("open");
    }

    if (langDropdown && langChevron) {
        langDropdown.classList.remove("active");
        langChevron.classList.remove("open");
    }
}

if (menuBtn && dropdownMenu && chevron) {
    menuBtn.addEventListener("click", (event) => {
        event.stopPropagation();

        const isOpen = dropdownMenu.classList.toggle("active");

        chevron.classList.toggle("open", isOpen);

        if (langDropdown && langChevron) {
            langDropdown.classList.remove("active");
            langChevron.classList.remove("open");
        }
    });
}

if (langBtn && langDropdown && langChevron) {
    langBtn.addEventListener("click", (event) => {
        event.stopPropagation();

        const isOpen = langDropdown.classList.toggle("active");

        langChevron.classList.toggle("open", isOpen);

        if (dropdownMenu && chevron) {
            dropdownMenu.classList.remove("active");
            chevron.classList.remove("open");
        }
    });
}

document.addEventListener("click", closeMenus);

document.querySelectorAll(".lang-option").forEach((option) => {
    option.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();

        setLanguage(option.getAttribute("data-lang"));

        closeMenus();
    });
});

function getTransitionState() {
    try {
        return new URL(window.location.href)
            .searchParams
            .get(TRANSITION_PARAM);
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

function getCloseRect() {
    const rect = panelClose.getBoundingClientRect();

    return {
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
        radius: rect.width / 2
    };
}

function getClip(rect) {
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

async function closeBio() {
    if (navigationBusy) {
        return;
    }

    navigationBusy = true;

    closeMenus();

    const rect = getCloseRect();
    const clip = getClip(rect);

    const target = new URL(HOME_URL);
    const currentLang = document.documentElement.lang;

    if (SUPPORTED_LANGS.includes(currentLang)) {
        target.searchParams.set("lang", currentLang);
    }

    target.searchParams.set(
        TRANSITION_PARAM,
        "bio-to-home"
    );

    if (reduceMotion.matches) {
        window.location.assign(target.href);
        return;
    }

    transition.hidden = false;
    transition.classList.add("is-active");
    transition.style.clipPath =
        "inset(0 0 0 0 round 0px)";

    const animation = transition.animate(
        [
            {
                clipPath: "inset(0 0 0 0 round 0px)"
            },
            {
                clipPath: clip
            }
        ],
        {
            duration: 420,
            easing: "cubic-bezier(0.4, 0, 0.2, 1)",
            fill: "forwards"
        }
    );

    await animation.finished;

    window.location.assign(target.href);
}

if (panelClose) {
    panelClose.addEventListener("click", closeBio);
}

document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
        closeBio();
    }
});

function finishOpenTransition() {
    const state = getTransitionState();

    if (state !== "home-to-bio") {
        return;
    }

    clearTransitionState();

    if (!transition) {
        return;
    }

    if (reduceMotion.matches) {
        transition.hidden = true;
        return;
    }

    transition.hidden = false;
    transition.classList.add("is-active");
    transition.style.clipPath =
        "inset(0 0 0 0 round 0px)";

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
        });
    });
}

setLanguage(detectInitialLang());
finishOpenTransition();