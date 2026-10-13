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
import { initHistory, initHistoryUI } from "./history.js";
import { demo30ChartsMarkdown } from "../utils/demo-charts.js";
import { sampleMarkdown } from "../utils/sample.js";
import { decodeShareHash, getShareModeFromHash, isShareHideModeFromHash } from "../utils/share.js";
import { setFocusMode } from "../utils/focusMode.js";
import { AppState } from "./state.js";
import { renderMarkdown } from "./render.js";
import { markdownEditor } from "./dom.js";
import { initMobile } from "./mobile.js";
import { initShortcuts, initExtraShortcuts } from "./shortcuts.js";
import { initDragDrop } from "./dragDrop.js";
import { initExportSetup } from "../utils/export.js";
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
  if (localStorage.getItem("kido-storage-migrated") === "true") {
    return;
  }
  const keys = [
    STORAGE_KEY,
    ACTIVE_TAB_KEY,
    UNTITLED_COUNTER_KEY,
    GROUPS_KEY,
    "kido-md-history",
    "kido-privacy-dismissed",
  ];
  const migrations = [];
  for (const key of keys) {
    const val = localStorage.getItem(key);
    if (val !== null) {
      migrations.push(
        localforage.setItem(key, val).then(() => {
          localStorage.removeItem(key);
        })
      );
    }
  }
  if (migrations.length > 0) {
    await Promise.all(migrations);
  }
  localStorage.setItem("kido-storage-migrated", "true");
}

export async function bootstrapApp() {
  await migrateFromLocalStorage();

  const yieldMain = () => {
    if (typeof scheduler !== "undefined" && typeof scheduler.yield === "function") {
      return scheduler.yield();
    }
    return new Promise((resolve) => setTimeout(resolve, 0));
  };

  const [tabs, activeTabId] = await Promise.all([
    loadTabsFromStorage(),
    loadActiveTabId(),
  ]);

  await yieldMain();

  const [tabGroups, storedHandle, untitledCounter] = await Promise.all([
    loadGroups(),
    localforage.getItem(VAULT_HANDLE_KEY),
    loadUntitledCounter(),
  ]);
  initHistory().catch(() => {});

  AppState.tabGroups = tabGroups || [];
  AppState.untitledCounter = untitledCounter || 0;
  AppState.tabs = tabs || [];
  AppState.activeTabId = activeTabId;

  if (storedHandle) {
    await initVault(storedHandle, true);
  }

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
      // Defer saving initial default tabs to idle/async so it doesn't block the main thread
      setTimeout(() => {
        saveTabsToStorage(AppState.tabs);
        saveActiveTabId(AppState.activeTabId);
      }, 300);
    }
  } else if (!AppState.tabs.find((t) => t.id === AppState.activeTabId)) {
    AppState.activeTabId = AppState.tabs[0].id;
    saveActiveTabId(AppState.activeTabId);
  }

  const shareContent = await decodeShareHash();
  const activeTab = AppState.tabs.find(
    (t) => t.id === AppState.activeTabId,
  );

  if (shareContent !== null && !AppState.localVaultMode) {
    const shareTab = createTab(shareContent, "Shared Note");
    AppState.tabs.push(shareTab);
    AppState.activeTabId = shareTab.id;
    markdownEditor.value = shareContent;
    restoreViewMode(getShareModeFromHash());
    if (isShareHideModeFromHash()) {
      setFocusMode(true);
    }
    saveTabsToStorage(AppState.tabs);
    saveActiveTabId(AppState.activeTabId);
  } else if (activeTab) {
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

  // Yield to break long task between storage load and initial markdown parse
  if (typeof scheduler !== "undefined" && typeof scheduler.yield === "function") {
    await scheduler.yield();
  } else {
    await new Promise((resolve) => setTimeout(resolve, 0));
  }

  const needsReRender = shareContent !== null || (activeTab && activeTab.content && activeTab.content !== sampleMarkdown);
  if (needsReRender) {
    renderMarkdown();
  }
  requestAnimationFrame(() => {
    if (!AppState.localVaultMode) {
      const activeTab = AppState.tabs.find(
        (t) => t.id === AppState.activeTabId,
      );
      if (activeTab) markdownEditor.scrollTop = activeTab.scrollPos || 0;
    }
  });
  renderTabBar(AppState.tabs, AppState.activeTabId);

  // Yield to allow browser to complete initial paint before wiring secondary listeners
  if (typeof scheduler !== "undefined" && typeof scheduler.yield === "function") {
    await scheduler.yield();
  } else {
    await new Promise((resolve) => setTimeout(resolve, 0));
  }

  initMobile();
  initShortcuts();
  initExtraShortcuts();
  initDragDrop();
  initExportSetup();
  initBackupSetup();
  initTagsSetup();
  initShare();
  initHistoryUI();
}
