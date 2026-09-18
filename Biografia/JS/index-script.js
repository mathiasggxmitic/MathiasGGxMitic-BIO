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
