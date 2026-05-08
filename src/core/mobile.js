import {
  charCountElement,
  wordCountElement,
  readingTimeElement,
} from './dom.js';
import { newTab, resetAllTabs } from "./tabs.js";
import {
  toggleSyncScrolling,
  setViewMode,
  syncScrollingEnabled,
} from "../utils/viewMode.js";
import { saveCurrentTabState } from "./tabs.js";

export function initMobile() {
  const mobileMenuPanel = document.getElementById("mobile-menu-panel");
  const mobileMenuOverlay = document.getElementById("mobile-menu-overlay");
  const mobileMenuToggle = document.getElementById("mobile-menu-toggle");
  const mobileCloseMenu = document.getElementById("mobile-close-menu");
  const mobileToggleVault = document.getElementById("mobile-toggle-vault");
  const mobileToggleSync = document.getElementById("mobile-toggle-sync");
  const mobileImportBtn = document.getElementById("mobile-import-btn");
  const mobileExportMd = document.getElementById("mobile-export-md");
  const mobileExportHtml = document.getElementById("mobile-export-html");
  const mobileExportPdf = document.getElementById("mobile-export-pdf");
  const mobileCopyMarkdown = document.getElementById("mobile-copy-markdown");
  const mobileThemeToggle = document.getElementById("mobile-theme-toggle");
  const mobileNewTabBtn = document.getElementById("mobile-new-tab-btn");
  const mobileTabResetBtn = document.getElementById("mobile-tab-reset-btn");
  const mobileViewModeButtons = document.querySelectorAll(
    ".mobile-view-mode-btn",
  );

  const themeToggle = document.getElementById("theme-toggle");
  const fileInput = document.getElementById("file-input");
  const exportMd = document.getElementById("export-md");
  const exportHtml = document.getElementById("export-html");
  const exportPdf = document.getElementById("export-pdf");
  const copyMarkdownButton = document.getElementById("copy-markdown-button");

  function openMobileMenu() {
    if (mobileMenuPanel) mobileMenuPanel.classList.add("active");
    if (mobileMenuOverlay) mobileMenuOverlay.classList.add("active");
  }

  function closeMobileMenu() {
    if (mobileMenuPanel) mobileMenuPanel.classList.remove("active");
    if (mobileMenuOverlay) mobileMenuOverlay.classList.remove("active");
  }

  if (mobileMenuToggle)
    mobileMenuToggle.addEventListener("click", openMobileMenu);
  if (mobileCloseMenu)
    mobileCloseMenu.addEventListener("click", closeMobileMenu);
  if (mobileMenuOverlay)
    mobileMenuOverlay.addEventListener("click", closeMobileMenu);

  if (mobileToggleVault) {
    mobileToggleVault.addEventListener("click", () => {
      const sidebar = document.getElementById("sidebar-explorer");
      if (sidebar) sidebar.classList.toggle("mobile-active");
      closeMobileMenu();
    });
  }

  if (mobileToggleSync) {
    mobileToggleSync.addEventListener("click", () => {
      toggleSyncScrolling();
      if (syncScrollingEnabled) {
        mobileToggleSync.innerHTML = '<i class="bi bi-link me-2"></i> On';
        mobileToggleSync.classList.add("sync-enabled");
        mobileToggleSync.classList.remove("sync-disabled", "border-primary");
      } else {
        mobileToggleSync.innerHTML = '<i class="bi bi-link-45deg me-2"></i> Off';
        mobileToggleSync.classList.add("sync-disabled", "border-primary");
        mobileToggleSync.classList.remove("sync-enabled");
      }
    });
  }

  if (mobileImportBtn && fileInput)
    mobileImportBtn.addEventListener("click", () => fileInput.click());
  if (mobileExportMd && exportMd)
    mobileExportMd.addEventListener("click", () => exportMd.click());
  if (mobileExportHtml && exportHtml)
    mobileExportHtml.addEventListener("click", () => exportHtml.click());
  if (mobileExportPdf && exportPdf)
    mobileExportPdf.addEventListener("click", () => exportPdf.click());
  if (mobileCopyMarkdown && copyMarkdownButton)
    mobileCopyMarkdown.addEventListener("click", () =>
      copyMarkdownButton.click(),
    );

  if (mobileThemeToggle && themeToggle) {
    mobileThemeToggle.addEventListener("click", () => {
      themeToggle.click();
      mobileThemeToggle.innerHTML = themeToggle.innerHTML + " Toggle Dark Mode";
    });
  }

  if (mobileNewTabBtn) {
    mobileNewTabBtn.addEventListener("click", function () {
      newTab();
      closeMobileMenu();
    });
  }

  if (mobileTabResetBtn) {
    mobileTabResetBtn.addEventListener("click", function () {
      closeMobileMenu();
      resetAllTabs();
    });
  }

  if (mobileViewModeButtons) {
    mobileViewModeButtons.forEach((btn) => {
      btn.addEventListener("click", function () {
        const mode = this.getAttribute("data-mode");
        setViewMode(mode);
        saveCurrentTabState();
        closeMobileMenu();
      });
    });
  }
}

export function updateMobileStats() {
  const mobileCharCount = document.getElementById("mobile-char-count");
  const mobileWordCount = document.getElementById("mobile-word-count");
  const mobileReadingTime = document.getElementById("mobile-reading-time");
  if (mobileCharCount && charCountElement)
    mobileCharCount.textContent = charCountElement.textContent;
  if (mobileWordCount && wordCountElement)
    mobileWordCount.textContent = wordCountElement.textContent;
  if (mobileReadingTime && readingTimeElement)
    mobileReadingTime.textContent = readingTimeElement.textContent;
}
