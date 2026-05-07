import { renderMarkdown } from "./render.js";
const themeToggle = document.getElementById("theme-toggle");
const root = document.documentElement;
export let isDarkTheme = false;
export function initTheme() {
themeToggle.addEventListener("click", function () {
    const theme =
      document.documentElement.getAttribute("data-theme") === "dark"
        ? "light"
        : "dark";
    document.documentElement.setAttribute("data-theme", theme);

    if (theme === "dark") {
      themeToggle.innerHTML = '<i class="bi bi-sun"></i>';
    } else {
      themeToggle.innerHTML = '<i class="bi bi-moon"></i>';
    }
    
    renderMarkdown();
  });

  
}