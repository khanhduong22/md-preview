import { themeToggle } from "../core/dom.js";
import { renderMarkdown } from "../core/render.js";

export function initTheme() {
  const prefersDarkMode =
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;
  document.documentElement.setAttribute(
    "data-theme",
    prefersDarkMode ? "dark" : "light",
  );
  if (themeToggle) {
    themeToggle.textContent = '';
    const icon = document.createElement('i');
    icon.className = prefersDarkMode ? 'bi bi-sun' : 'bi bi-moon';
    themeToggle.appendChild(icon);

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
}
