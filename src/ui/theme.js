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

  // Document Theme Selector Logic
  const themeSelectors = document.querySelectorAll(".doc-theme-select");
  const markdownPreview = document.getElementById("markdown-preview");

  if (themeSelectors.length > 0 && markdownPreview) {
    themeSelectors.forEach((selector) => {
      selector.addEventListener("click", (e) => {
        e.preventDefault();
        
        // Remove active class from all
        themeSelectors.forEach(s => s.classList.remove("active"));
        // Add active to clicked
        selector.classList.add("active");

        // Get selected theme
        const selectedTheme = selector.getAttribute("data-theme");

        // Remove all existing theme classes from preview
        markdownPreview.className.split(' ').forEach(className => {
          if (className.startsWith('theme-')) {
            markdownPreview.classList.remove(className);
          }
        });

        // Add new theme class if not default
        if (selectedTheme !== "default") {
          markdownPreview.classList.add(`theme-${selectedTheme}`);
        }
      });
    });
  }
}
