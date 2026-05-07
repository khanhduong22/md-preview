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
import { initHistory } from "./history.js";
import { demo30ChartsMarkdown } from "../utils/demo-charts.js";
import { sampleMarkdown } from "../utils/sample.js";
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
        const demoGroup = { id: "demo-group", name: "demo", color: "purple" }; // Wait, createGroup is not imported here easily, let's keep it simple
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
      const activeTab = AppState.tabs.find(
        (t) => t.id === AppState.activeTabId,
      );
      if (activeTab) {
        markdownEditor.value = activeTab.content || "";
        restoreViewMode(activeTab.viewMode);
      }
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
}
