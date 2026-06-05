import {
  createTab,
  saveTabsToStorage,
  saveActiveTabId,
  renderTabBar,
  loadGroups,
  loadUntitledCounter,
  loadTabsFromStorage,
  loadActiveTabId,
} from "./tabs.js";
import { initVault } from "./vault.js";
import { restoreViewMode } from "../utils/viewMode.js";
import { initHistory } from "./history.js";
import { demo30ChartsMarkdown } from "../utils/demo-charts.js";
import { sampleMarkdown } from "../utils/sample.js";
import { decodeShareHash, getShareModeFromHash } from "../utils/share.js";
import { AppState } from "./state.js";
import { renderMarkdown } from "./render.js";
import { markdownEditor } from "./dom.js";
import { initMobile } from "./mobile.js";
import { initShortcuts, initExtraShortcuts } from "./shortcuts.js";
import { initDragDrop } from "./dragDrop.js";
import { initExportSetup, initExportEvents } from "../utils/export.js";
import { initBackupSetup } from "../utils/backup.js";
import { initTagsSetup } from "../utils/tags.js";
import { initShare } from "../utils/share.js";
import '../utils/search.js';

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
    await initVault(storedHandle, true);
  }

  AppState.untitledCounter = await loadUntitledCounter();
  AppState.tabs = await loadTabsFromStorage();
  AppState.activeTabId = await loadActiveTabId();

  // Create default tabs if none exist (only in normal mode)
  if (AppState.tabs.length === 0) {
    if (!AppState.localVaultMode) {
      const tab = createTab(sampleMarkdown, "Welcome to Markdown");
      AppState.tabs.push(tab);

      if (typeof demo30ChartsMarkdown !== "undefined") {
        const demoTab = createTab(demo30ChartsMarkdown, "30 chart");
        AppState.tabs.push(demoTab);
      }

      AppState.activeTabId = tab.id;
      saveTabsToStorage(AppState.tabs);
      saveActiveTabId(AppState.activeTabId);
    }
  } else if (!AppState.tabs.find((t) => t.id === AppState.activeTabId)) {
    AppState.activeTabId = AppState.tabs[0].id;
    saveActiveTabId(AppState.activeTabId);
  }

  const shareContent = decodeShareHash();
  if (shareContent !== null && !AppState.localVaultMode) {
    const shareTab = createTab(shareContent, "Shared Note");
    AppState.tabs.push(shareTab);
    AppState.activeTabId = shareTab.id;
    markdownEditor.value = shareContent;
    restoreViewMode(getShareModeFromHash());
    saveTabsToStorage(AppState.tabs);
    saveActiveTabId(AppState.activeTabId);
  } else {
    const activeTab = AppState.tabs.find(
      (t) => t.id === AppState.activeTabId,
    );
    if (activeTab) {
      // If it's a vault file and we have permission, try to read the latest content from disk
      if (activeTab.handle && AppState.localVaultMode) {
        try {
          const perm = await activeTab.handle.queryPermission({ mode: 'readwrite' });
          if (perm === 'granted') {
            const file = await activeTab.handle.getFile();
            activeTab.content = await file.text();
          }
        } catch (e) {
          console.warn("Could not load active tab from file system on bootstrap, using cached content", e);
        }
      }
      markdownEditor.value = activeTab.content || "";
      restoreViewMode(activeTab.viewMode);
    }
  }

  renderMarkdown();
  requestAnimationFrame(() => {
    if (!AppState.localVaultMode) {
      const activeTab = AppState.tabs.find(
        (t) => t.id === AppState.activeTabId,
      );
      if (activeTab) markdownEditor.scrollTop = activeTab.scrollPos || 0;
    }
  });
  renderTabBar(AppState.tabs, AppState.activeTabId);
  initMobile();
  initShortcuts();
  initExtraShortcuts();
  initDragDrop();
  initExportSetup();
  initExportEvents();
  initBackupSetup();
  initTagsSetup();
  initShare();
}
