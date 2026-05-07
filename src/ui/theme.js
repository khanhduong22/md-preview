import { themeToggle } from "../core/dom.js";

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
  }
}
