import { toggleSyncScrolling, currentViewMode } from "../utils/viewMode.js";
import { newTab, closeTab } from "./tabs.js";
import { AppState } from "./state.js";
export function initShortcuts() {
document.getElementById('tab-reset-btn').addEventListener('click', function() {
    resetAllTabs();
  });
  
  const logoHome = document.getElementById('logo-home');
  if (logoHome) {
    logoHome.addEventListener('click', function() {
      resetAllTabs();
    });
  }

  // ========================================
  // MERMAID DIAGRAM TOOLBAR
  // ========================================

  /**
   * Serialises an SVG element to a data URL suitable for use as an image source.
   * Inline styles and dimensions are preserved so the PNG matches the rendered diagram.
   */
  
// --- Removed Block ---

// --- Removed Focus Mode ---

}
export function initExtraShortcuts() {
document.addEventListener("keydown", async function (e) {
    if ((e.ctrlKey || e.metaKey) && e.key === "s") {
      e.preventDefault();
      
      const currentTab = AppState.tabs.find(t => t.id === AppState.activeTabId);
      if (AppState.localVaultMode && AppState.vaultDirHandle && currentTab) {
        if (currentTab.handle) {
          await saveCurrentTabState(true);
          const exportBtn = document.getElementById('exportDropdown');
          if (exportBtn) {
             const origHtml = exportBtn.innerHTML;
             exportBtn.innerHTML = '<i class="bi bi-check2"></i> <span class="btn-label">Saved</span>';
             setTimeout(() => { exportBtn.innerHTML = origHtml; }, 1500);
          }
        } else {
          try {
            let name = prompt('Save to Vault as:', currentTab.title + '.md');
            if (name) {
              if (!name.endsWith('.md')) name += '.md';
              let fileHandle;
              try {
                fileHandle = await AppState.vaultDirHandle.getFileHandle(name, { create: false });
                if (!confirm('File "' + name + '" already exists. Overwrite?')) return;
                fileHandle = await AppState.vaultDirHandle.getFileHandle(name, { create: true });
              } catch(err) {
                fileHandle = await AppState.vaultDirHandle.getFileHandle(name, { create: true });
              }
              const writable = await fileHandle.createWritable();
              await writable.write(currentTab.content || markdownEditor.value);
              await writable.close();
              
              currentTab.handle = fileHandle;
              currentTab.title = name.replace(/\\.md$/i, '');
              currentTab.id = '/' + name;
              
              renderTabBar(AppState.tabs, AppState.activeTabId);
              await renderVaultTree();
              
              const exportBtn = document.getElementById('exportDropdown');
              if (exportBtn) {
                 const origHtml = exportBtn.innerHTML;
                 exportBtn.innerHTML = '<i class="bi bi-check2"></i> <span class="btn-label">Saved</span>';
                 setTimeout(() => { exportBtn.innerHTML = origHtml; }, 1500);
              }
            }
          } catch(err) {
            alert('Error saving to vault: ' + err.message);
          }
        }
      } else {
        exportMd.click();
      }
    }
    if ((e.ctrlKey || e.metaKey) && e.key === "c") {
      const activeEl = document.activeElement;
      const isTextControl = activeEl && (activeEl.tagName === "TEXTAREA" || activeEl.tagName === "INPUT");
      const hasSelection = window.getSelection && window.getSelection().toString().trim().length > 0;
      if (!isTextControl && !hasSelection) {
        e.preventDefault();
        copyMarkdownButton.click();
      }
    }
    // Story 1.2: Only allow sync toggle shortcut when in split view
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "S") {
      e.preventDefault();
      if (currentViewMode === 'split') {
        toggleSyncScrolling();
      }
    }
    // New tab
    if ((e.ctrlKey || e.metaKey) && e.key === "t") {
      e.preventDefault();
      newTab();
    }
    // Close tab
    if ((e.ctrlKey || e.metaKey) && e.key === "w") {
      e.preventDefault();
      closeTab(AppState.activeTabId);
    }
    // Close Mermaid zoom modal with Escape
    if (e.key === "Escape") {
      closeMermaidModal();
    }
  });

  
}