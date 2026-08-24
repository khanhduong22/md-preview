import { AppState } from "./state.js";
import { saveCurrentTabState, saveTabsToStorage, saveActiveTabId, renderTabBar } from "./tabs.js";
import { renderVaultTree } from "./vault.js";
import { formatDateTimestamp, sanitizeFileName, extractMarkdownTitle, isUntitledTab } from "../utils/autoname.js";
import { markdownEditor } from "./dom.js";

let autoSaveDebounceTimer = null;

/**
 * Persist a virtual (in-memory) tab to the local Vault on disk.
 * Generates a clean filename with DDMMYY_HHmm timestamp, acquires a file handle,
 * updates tab IDs without state desync, writes content, and updates UI.
 * @param {object} tab
 * @returns {Promise<boolean>}
 */
export async function persistVirtualTabToVault(tab) {
  if (!AppState.localVaultMode || !AppState.vaultDirHandle || !tab) return false;
  if (tab.handle) return false; // Already has handle
  
  // Tab content: prefer editor value if active, otherwise tab.content
  const content = (tab.id === AppState.activeTabId && markdownEditor)
    ? markdownEditor.value
    : (tab.content || '');

  // Do not auto-save empty tabs (0 characters) to prevent cluttering disk
  if (!content || !content.trim()) return false;

  try {
    // 1. Derive base title (extract from markdown header if untitled)
    let baseTitle = tab.title;
    if (isUntitledTab(baseTitle)) {
      const extracted = extractMarkdownTitle(content);
      if (extracted) {
        baseTitle = extracted;
      }
    }
    const cleanBase = sanitizeFileName(baseTitle || 'Untitled', 40);
    const timestamp = formatDateTimestamp();
    let fileName = `${cleanBase}_${timestamp}.md`;

    // 2. Resolve collisions if a file with the same timestamp already exists
    let fileHandle;
    try {
      fileHandle = await AppState.vaultDirHandle.getFileHandle(fileName, { create: false });
      // If found, append random suffix
      fileName = `${cleanBase}_${timestamp}_${Math.random().toString(36).slice(2, 6)}.md`;
    } catch {
      // File does not exist yet, fileName is ready
    }

    fileHandle = await AppState.vaultDirHandle.getFileHandle(fileName, { create: true });

    // 3. Write content immediately to file handle
    const writable = await fileHandle.createWritable();
    await writable.write(content);
    await writable.close();

    // 4. Update tab properties and sync activeTabId
    const oldId = tab.id;
    const newId = AppState.vaultDirHandle.name + '/' + fileName;
    tab.handle = fileHandle;
    tab.id = newId;
    tab.path = newId;
    tab.title = fileName.replace(/\.md$/i, '');
    tab.content = content;
    tab.lastVaultSave = Date.now();

    if (AppState.activeTabId === oldId) {
      AppState.activeTabId = newId;
      saveActiveTabId(newId);
    }

    // 5. Update search index if initialized
    if (AppState.vaultMiniSearch) {
      try {
        const doc = { id: tab.id, title: tab.title, path: tab.path, content: tab.content };
        if (AppState.vaultMiniSearch.has(tab.id)) {
          AppState.vaultMiniSearch.replace(doc);
        } else {
          AppState.vaultMiniSearch.add(doc);
        }
      } catch (searchErr) {
        console.warn('MiniSearch index update failed:', searchErr);
      }
    }

    // 6. Synchronize persistent storage and re-render UI
    saveTabsToStorage(AppState.tabs);
    renderTabBar(AppState.tabs, AppState.activeTabId);
    if (typeof renderVaultTree === 'function') {
      await renderVaultTree();
    }

    console.log(`Auto-saved virtual tab to vault: ${fileName}`);
    return true;
  } catch (err) {
    console.error('Failed to auto-save virtual tab to vault:', err);
    return false;
  }
}

/**
 * Trigger a debounced auto-save to vault (e.g. after typing pause)
 * @param {number} [delay=5000]
 */
export function queueVaultAutoSave(delay = 5000) {
  if (!AppState.localVaultMode || !AppState.vaultDirHandle) return;
  
  clearTimeout(autoSaveDebounceTimer);
  autoSaveDebounceTimer = setTimeout(async () => {
    const currentTab = AppState.tabs.find(t => t.id === AppState.activeTabId);
    if (!currentTab) return;

    if (currentTab.handle) {
      await saveCurrentTabState(true);
      currentTab.lastVaultSave = Date.now();
    } else if (currentTab.content && currentTab.content.trim().length > 0) {
      await persistVirtualTabToVault(currentTab);
    }
  }, delay);
}

/**
 * Initialize periodic background auto-save interval
 */
export function initAutoSave() {
  setInterval(async () => {
    if (!AppState.localVaultMode || !AppState.vaultDirHandle) return;
    const currentTab = AppState.tabs.find(t => t.id === AppState.activeTabId);
    if (!currentTab) return;
    
    if (currentTab.handle) {
      // Periodic save every 30s if dirty or after interval
      if (!currentTab.lastVaultSave) currentTab.lastVaultSave = Date.now();
      if (Date.now() - currentTab.lastVaultSave >= 30000) {
        await saveCurrentTabState(true);
        currentTab.lastVaultSave = Date.now();
        console.log("Vault file periodically auto-saved");
      }
    } else {
      // Virtual file with content in vault mode: auto save to vault
      const content = markdownEditor ? markdownEditor.value : (currentTab.content || '');
      if (content && content.trim().length > 0) {
        await persistVirtualTabToVault(currentTab);
      }
    }
  }, 15000); // Check every 15 seconds
}