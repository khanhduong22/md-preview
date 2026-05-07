import { AppState } from "./state.js";
import { saveCurrentTabState } from "./tabs.js";
import { renderVaultTree } from "./vault.js";
export function initAutoSave() {
  setInterval(async () => {
    if (!AppState.localVaultMode || !AppState.vaultDirHandle) return;
    const currentTab = AppState.tabs.find(t => t.id === AppState.activeTabId);
    if (!currentTab) return;
    
    if (currentTab.handle) {
      // 1.5 minutes vault auto-save
      if (!currentTab.lastVaultSave) currentTab.lastVaultSave = Date.now();
      if (Date.now() - currentTab.lastVaultSave >= 90000) {
         await saveCurrentTabState(true);
         currentTab.lastVaultSave = Date.now();
         console.log("Vault file auto-saved");
      }
    } else {
      // Virtual file in vault mode: open for >= 5 minutes -> auto save
      if (!currentTab.createdAt) currentTab.createdAt = Date.now();
      if (Date.now() - currentTab.createdAt >= 300000) { // 5 minutes
         try {
           let safeName = currentTab.title.replace(/[\\/:*?"<>|]/g, '-');
           if (!safeName.endsWith('.md')) safeName += '.md';
           
           let fileHandle;
           try {
             fileHandle = await AppState.vaultDirHandle.getFileHandle(safeName, { create: false });
             safeName = safeName.replace('.md', '_' + Date.now() + '.md');
             fileHandle = await AppState.vaultDirHandle.getFileHandle(safeName, { create: true });
           } catch(e) {
             fileHandle = await AppState.vaultDirHandle.getFileHandle(safeName, { create: true });
           }
           
           currentTab.handle = fileHandle;
           currentTab.id = AppState.vaultDirHandle.name + '/' + safeName;
           currentTab.lastVaultSave = Date.now();
           await saveCurrentTabState(true);
           if (typeof renderVaultTree === 'function') renderVaultTree();
           console.log("Virtual file auto-saved to vault after 5 minutes");
        } catch(e) {
            console.error("Auto-save failed", e);
        }
      }
    }
  }, 30000); // Check every 30 seconds
}