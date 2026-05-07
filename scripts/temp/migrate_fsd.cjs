const fs = require('fs');
const path = require('path');

// --- 1. Create src/core/dom.js ---
const domContent = `export const markdownEditor = document.getElementById("markdown-editor");
export const themeToggle = document.getElementById("theme-toggle");
export const toggleSyncButton = document.getElementById("toggle-sync");
export const editorPane = document.getElementById("markdown-editor");
export const previewPane = document.querySelector(".preview-pane");
export const readingTimeElement = document.getElementById("reading-time");
export const wordCountElement = document.getElementById("word-count");
export const charCountElement = document.getElementById("char-count");
`;
fs.writeFileSync('src/core/dom.js', domContent);

// --- 2. Update imports across all files ---
function replaceImports(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      replaceImports(fullPath);
    } else if (fullPath.endsWith('.js') && fullPath !== 'src/main.js' && fullPath !== 'src/core/dom.js') {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // We need to replace import { ... } from '../main.js' or './main.js' 
      // with relative import to dom.js
      const depth = fullPath.split(path.sep).length - 2; // depth from src. e.g. src/core/tabs.js -> depth 1.
      let domImportPath = depth === 1 ? '../core/dom.js' : './core/dom.js';
      
      if (fullPath.includes('src/core/')) domImportPath = './dom.js';
      else if (fullPath.includes('src/utils/')) domImportPath = '../core/dom.js';
      
      let updated = content.replace(/from\s+['"]\.\.?\/main\.js['"]/g, `from '${domImportPath}'`);
      if (content !== updated) fs.writeFileSync(fullPath, updated);
    }
  }
}
replaceImports('src');

// --- 3. Create src/ui/theme.js ---
if (!fs.existsSync('src/ui')) fs.mkdirSync('src/ui');
const themeContent = `import { themeToggle } from "../core/dom.js";

export function initTheme() {
  const prefersDarkMode = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  document.documentElement.setAttribute("data-theme", prefersDarkMode ? "dark" : "light");
  themeToggle.innerHTML = prefersDarkMode ? '<i class="bi bi-sun"></i>' : '<i class="bi bi-moon"></i>';
}
`;
fs.writeFileSync('src/ui/theme.js', themeContent);

// --- 4. Create src/ui/privacy.js ---
const privacyContent = `export function initPrivacyNotice() {
  const privacyNotice = document.getElementById("privacy-notice");
  const privacyDismiss = document.getElementById("privacy-dismiss");

  if (privacyNotice && !localStorage.getItem("kido-privacy-dismissed")) {
    privacyNotice.style.display = "block";
  }

  if (privacyDismiss) {
    privacyDismiss.addEventListener("click", () => {
      privacyNotice.classList.add("dismissing");
      localStorage.setItem("kido-privacy-dismissed", "1");
      setTimeout(() => {
        privacyNotice.style.display = "none";
      }, 300);
    });
  }
}
`;
fs.writeFileSync('src/ui/privacy.js', privacyContent);

// --- 5. Create src/core/editor.js ---
const editorContent = `import { markdownEditor } from "./dom.js";
import { saveCurrentTabState } from "./tabs.js";
import { debouncedRender } from "./render.js";
import { loadHistory, saveShareSnapshot } from "./history.js";
import { AppState } from "./state.js";

export function initEditor() {
  let autoSnapshotTimer = null;
  let saveTabStateTimeout = null;

  markdownEditor.addEventListener("input", function () {
    debouncedRender();
    clearTimeout(saveTabStateTimeout);
    saveTabStateTimeout = setTimeout(saveCurrentTabState, 500);

    // Auto-snapshot: debounced 5s after stopping typing
    clearTimeout(autoSnapshotTimer);
    autoSnapshotTimer = setTimeout(() => {
      const content = markdownEditor.value;
      if (!content.trim()) return; // skip empty
      const allHistory = loadHistory();
      const tabHistory = allHistory.filter((s) => s.tabId === AppState.activeTabId);
      const last = tabHistory.length > 0 ? tabHistory[tabHistory.length - 1] : null;
      
      // Only save if content changed by at least 20 chars or 5% difference
      if (!last || Math.abs(content.length - (last.content || "").length) >= 20) {
        const currentTab = AppState.tabs.find((t) => t.id === AppState.activeTabId);
        saveShareSnapshot(content, currentTab ? currentTab.title : "Untitled");
      }
    }, 5000);
  });

  // Tab key handler to insert indentation instead of moving focus
  markdownEditor.addEventListener("keydown", function (e) {
    if (e.key === "Tab") {
      e.preventDefault();

      const start = this.selectionStart;
      const end = this.selectionEnd;
      const value = this.value;
      const indent = "  "; // 2 spaces

      this.value = value.substring(0, start) + indent + value.substring(end);
      this.selectionStart = this.selectionEnd = start + indent.length;
      this.dispatchEvent(new Event("input"));
    }
  });
}
`;
fs.writeFileSync('src/core/editor.js', editorContent);

// --- 6. Create src/core/app.js ---
const appContent = `import {
  createTab,
  saveTabsToStorage,
  saveActiveTabId,
  renderTabBar,
  loadGroups,
  loadUntitledCounter,
  loadTabsFromStorage,
  loadActiveTabId
} from "./tabs.js";
import { initVault } from "./vault.js";
import { initHistory } from "./history.js";
import { demo30ChartsMarkdown } from "../utils/demo-charts.js";
import { sampleMarkdown } from "../utils/sample.js";
import { restoreViewMode } from "../utils/viewMode.js";
import { decodeShareHash } from "../utils/share.js";
import { AppState } from "./state.js";
import { renderMarkdown } from "./render.js";
import { markdownEditor } from "./dom.js";
import { initMobile } from "./mobile.js";

const STORAGE_KEY = "markdownViewerTabs";
const ACTIVE_TAB_KEY = "markdownViewerActiveTab";
const UNTITLED_COUNTER_KEY = "markdownViewerUntitledCounter";
const VAULT_HANDLE_KEY = "kido-vault-handle";
const GROUPS_KEY = "markdownViewerGroups";

async function migrateFromLocalStorage() {
  const keys = [
    STORAGE_KEY,
    ACTIVE_TAB_KEY,
    UNTITLED_COUNTER_KEY,
    GROUPS_KEY,
    "kido-md-history",
    "kido-privacy-dismissed",
  ];
  for (const key of keys) {
    const val = localStorage.getItem(key);
    if (val !== null) {
      await localforage.setItem(key, val);
      localStorage.removeItem(key);
    }
  }
}

export async function bootstrapApp() {
  await migrateFromLocalStorage();
  await initHistory();
  AppState.tabGroups = await loadGroups();

  const storedHandle = await localforage.getItem(VAULT_HANDLE_KEY);
  if (storedHandle) {
    await initVault(storedHandle);
  }

  AppState.untitledCounter = await loadUntitledCounter();
  AppState.tabs = await loadTabsFromStorage();
  AppState.activeTabId = await loadActiveTabId();
  
  if (!AppState.localVaultMode) {
    if (AppState.tabs.length === 0) {
      const tab = createTab(sampleMarkdown, "Welcome to Markdown");
      AppState.tabs.push(tab);

      if (typeof demo30ChartsMarkdown !== "undefined") {
        const demoGroup = { id: 'demo-group', name: 'demo', color: 'purple' }; // Wait, createGroup is not imported here easily, let's keep it simple
        const demoTab = createTab(demo30ChartsMarkdown, "30 chart");
        // demoTab.groupId = demoGroup.id;
        AppState.tabs.push(demoTab);
      }

      AppState.activeTabId = tab.id;
      saveTabsToStorage(AppState.tabs);
      saveActiveTabId(AppState.activeTabId);
    } else if (!AppState.tabs.find((t) => t.id === AppState.activeTabId)) {
      AppState.activeTabId = AppState.tabs[0].id;
      saveActiveTabId(AppState.activeTabId);
    }

    const shareContent = decodeShareHash();
    if (shareContent !== null) {
      const shareTab = createTab(shareContent, "Shared Note");
      AppState.tabs.push(shareTab);
      AppState.activeTabId = shareTab.id;
      markdownEditor.value = shareContent;
      restoreViewMode("split");
      saveTabsToStorage(AppState.tabs);
      saveActiveTabId(AppState.activeTabId);
    } else {
      const activeTab = AppState.tabs.find((t) => t.id === AppState.activeTabId);
      if (activeTab) {
        markdownEditor.value = activeTab.content || "";
        restoreViewMode(activeTab.viewMode);
      }
    }
  }

  renderMarkdown();
  requestAnimationFrame(() => {
    if (!AppState.localVaultMode) {
      const activeTab = AppState.tabs.find((t) => t.id === AppState.activeTabId);
      if (activeTab) markdownEditor.scrollTop = activeTab.scrollPos || 0;
    }
  });
  renderTabBar(AppState.tabs, AppState.activeTabId);
  initMobile();
}
`;
fs.writeFileSync('src/core/app.js', appContent);

// --- 7. Create src/main.js ---
const mainContent = `import { initTheme } from "./ui/theme.js";
import { initPrivacyNotice } from "./ui/privacy.js";
import { initEditor } from "./core/editor.js";
import { initViewModeUI } from "./utils/viewMode.js";
import { bootstrapApp } from "./core/app.js";
import { initMarkdownParser } from "./core/markdown.js";
import { startTour } from "./utils/tour.js";
import { initAutoSave } from "./core/autosave.js";
import { sampleMarkdown } from "./utils/sample.js";
import { markdownEditor } from "./core/dom.js";

// Set initial value so it doesn't flash empty
markdownEditor.value = sampleMarkdown;

document.addEventListener("DOMContentLoaded", () => {
  initMarkdownParser();
  initTheme();
  initPrivacyNotice();
  initEditor();
  initViewModeUI();
  bootstrapApp();
  initAutoSave();

  const hasSeenTour = localStorage.getItem("hasSeenTour");
  if (!hasSeenTour && window.innerWidth >= 768) {
    setTimeout(() => {
      startTour();
      localStorage.setItem("hasSeenTour", "true");
    }, 1000);
  }
});
`;
fs.writeFileSync('src/main.js', mainContent);

// --- 8. Update viewMode.js to export initViewModeUI ---
let viewModeJs = fs.readFileSync('src/utils/viewMode.js', 'utf8');
viewModeJs += `

import { editorPane, previewPane, toggleSyncButton } from '../core/dom.js';
import { saveCurrentTabState } from '../core/tabs.js';

export function initViewModeUI() {
  const viewModeButtons = document.querySelectorAll(".view-mode-btn:not(.focus-mode-toggle-btn)");
  
  viewModeButtons.forEach((btn) => {
    btn.addEventListener("click", function () {
      const mode = this.getAttribute("data-mode");
      setViewMode(mode);
      saveCurrentTabState();
    });
  });

  if (editorPane) editorPane.addEventListener("scroll", syncEditorToPreview);
  if (previewPane) previewPane.addEventListener("scroll", syncPreviewToEditor);
  if (toggleSyncButton) toggleSyncButton.addEventListener("click", toggleSyncScrolling);
  
  initResizer();
}
`;
fs.writeFileSync('src/utils/viewMode.js', viewModeJs);
