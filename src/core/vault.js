import { VAULT_HANDLE_KEY } from "./constants.js";
import { AppState } from './state.js';
import { renderTabBar, saveCurrentTabState, createTab, createGroup, switchTab, deleteTab, closeTab } from './tabs.js';
import { markdownEditor } from './dom.js';

  export async function doVaultRename(entry, newName, fallbackCb) {
    try {
      if (entry.handle.kind === 'directory') {
         const destDirHandle = await entry.parentDir.getDirectoryHandle(newName, { create: true });
         async function copyDir(srcDir, destDir) {
            for await (const [name, handle] of srcDir.entries()) {
              if (handle.kind === 'file') {
                const file = await handle.getFile();
                const destFile = await destDir.getFileHandle(name, { create: true });
                const writable = await destFile.createWritable();
                await writable.write(await file.arrayBuffer());
                await writable.close();
              } else if (handle.kind === 'directory') {
                const subDestDir = await destDir.getDirectoryHandle(name, { create: true });
                await copyDir(handle, subDestDir);
              }
            }
         }
         await copyDir(entry.handle, destDirHandle);
         await entry.parentDir.removeEntry(entry.name, { recursive: true });
         
         let group = AppState.tabGroups.find(g => g.name === entry.name);
         if (group) { 
           group.name = newName; 
           renderTabBar(AppState.tabs, AppState.activeTabId); 
           if(typeof saveTabGroups === 'function') saveTabGroups(); 
         }
      } else {
         if (!newName.endsWith('.md')) newName += '.md';
         const file = await entry.handle.getFile();
         const text = await file.text();
         const newHandle = await entry.parentDir.getFileHandle(newName, { create: true });
         const writable = await newHandle.createWritable();
         await writable.write(text);
         await writable.close();
         await entry.parentDir.removeEntry(entry.name);
         
         // Fix active tab logic
         if (AppState.activeTabId === entry.path) {
           const parentPath = entry.path.substring(0, entry.path.lastIndexOf('/'));
           AppState.activeTabId = parentPath + '/' + newName;
         }
         
         // Update loaded AppState.tabs
         let tab = AppState.tabs.find(t => t.id === entry.path);
         if (tab) {
           const parentPath = entry.path.substring(0, entry.path.lastIndexOf('/'));
           tab.id = parentPath + '/' + newName;
           tab.title = newName;
           tab.handle = newHandle;
         }
      }
      await renderVaultTree();
    } catch (err) {
      alert('Rename failed: ' + err.message);
      if (fallbackCb) fallbackCb();
    }
  }

  export function startInlineRename(element, originalName, onComplete) {
    const input = document.createElement('input');
    input.type = 'text';
    input.value = originalName;
    input.className = 'inline-rename-input';
    
    let isFinished = false;
    const finish = (val) => {
      if (isFinished) return;
      isFinished = true;
      onComplete(val);
    };

    input.onblur = () => finish(input.value.trim());
    input.onkeydown = (e) => {
      if (e.key === 'Enter') finish(input.value.trim());
      if (e.key === 'Escape') finish(originalName);
    };

    element.replaceWith(input);
    input.focus();
    input.select();
  }

  export async function openLocalVault() {
    try {
      AppState.vaultDirHandle = await window.showDirectoryPicker({ mode: 'readwrite' });
      await localforage.setItem(VAULT_HANDLE_KEY, AppState.vaultDirHandle);
      
      // Backup virtual tabs before clearing them so they can be imported
      const virtualTabs = AppState.tabs.filter(t => !t.handle);
      if (virtualTabs.length > 0) {
        await localforage.setItem("md-preview-tabs", JSON.stringify(virtualTabs));
      }
      
      await initVault(AppState.vaultDirHandle, false);
    } catch (e) {
      console.error("Vault open failed:", e);
    }
  }

  export async function initVault(handle, isRestore = false) {
    if (!handle) return;
    AppState.vaultDirHandle = handle;
    AppState.localVaultMode = true;
    document.querySelector('.empty-vault-message').style.display = 'none';

    if (await AppState.vaultDirHandle.queryPermission({ mode: 'readwrite' }) !== 'granted') {
      const btn = document.createElement('button');
      btn.className = 'tool-button';
      btn.style.margin = '10px';
      btn.innerText = 'Re-authorize Vault Access';
      btn.onclick = async () => {
        if (await AppState.vaultDirHandle.requestPermission({ mode: 'readwrite' }) === 'granted') {
          await renderVaultTree();
          
          // Reload active tab content from file system now that we have permission
          const activeTab = AppState.tabs.find(t => t.id === AppState.activeTabId);
          if (activeTab && activeTab.handle) {
            try {
              const file = await activeTab.handle.getFile();
              activeTab.content = await file.text();
              markdownEditor.value = activeTab.content || '';
              const { renderMarkdown } = await import('./render.js');
              renderMarkdown();
            } catch (err) {
              console.warn("Failed to reload active tab after re-authorization", err);
            }
          }
        }
      };
      const tree = document.getElementById('file-tree');
      tree.innerHTML = '';
      tree.appendChild(btn);
      return;
    }
    
    if (!isRestore) {
      // Clear virtual AppState.tabs completely to focus on Vault
      AppState.tabs = [];
      AppState.activeTabId = null;
      markdownEditor.value = '';
      renderTabBar(AppState.tabs, AppState.activeTabId);
    }
    
    document.getElementById('root-new-folder-btn').style.display = 'inline-flex';
    document.getElementById('root-new-file-btn').style.display = 'inline-flex';
    if(document.querySelector('.vault-action-divider')) document.querySelector('.vault-action-divider').style.display = 'block';

    const handleRootNewFile = async () => {
      try {
        let name = prompt('New Markdown File Name at Root:');
        if (name) {
          if (!name.endsWith('.md')) name += '.md';
          await AppState.vaultDirHandle.getFileHandle(name, { create: true });
          await renderVaultTree();
        }
      } catch (e) { alert('Error: ' + e.message); }
    };

    const handleRootNewFolder = async () => {
      try {
        let name = prompt('New Folder Name at Root:');
        if (name) {
          await AppState.vaultDirHandle.getDirectoryHandle(name, { create: true });
          await renderVaultTree();
        }
      } catch (e) { alert('Error: ' + e.message); }
    };
    
    // Unbind and rebind
    const fileBtn = document.getElementById('root-new-file-btn');
    const folderBtn = document.getElementById('root-new-folder-btn');
    fileBtn.replaceWith(fileBtn.cloneNode(true));
    folderBtn.replaceWith(folderBtn.cloneNode(true));
    document.getElementById('root-new-file-btn').addEventListener('click', handleRootNewFile);
    document.getElementById('root-new-folder-btn').addEventListener('click', handleRootNewFolder);

    await renderVaultTree();
  }

  export async function openVaultFile(entry) {
    let tab = AppState.tabs.find(t => t.id === entry.path);
    if (!tab) {
      tab = createTab('', entry.name);
      tab.id = entry.path; // force path as ID
      tab.handle = entry.handle;
      
      const segments = entry.path.split('/').filter(Boolean);
      if (segments.length > 1) {
        const folderName = segments[segments.length - 2];
        let group = AppState.tabGroups.find(g => g.name === folderName);
        if (!group) {
          group = createGroup(folderName, GROUP_COLORS[Math.floor(Math.random() * GROUP_COLORS.length)].name);
        }
        tab.groupId = group.id;
      }

      AppState.tabs.push(tab);
    }
    await switchTab(tab.id);
  }

  export async function renderVaultTree() {
    const treeEl = document.getElementById('file-tree');
    treeEl.innerHTML = '';
    
    // Prepare MiniSearch
    if (window.MiniSearch) {
      AppState.vaultMiniSearch = new window.MiniSearch({
        fields: ['title', 'content'], 
        storeFields: ['title', 'content', 'path']
      });
    }

    const buildTree = async (dirHandle, path, parentEl) => {
      let entries = [];
      for await (const [name, handle] of dirHandle.entries()) {
        if (name.startsWith('.')) continue;
        entries.push({ name, handle, path: path + '/' + name, parentDir: dirHandle });
      }
      entries.sort((a, b) => {
        if (a.handle.kind === b.handle.kind) return a.name.localeCompare(b.name);
        return a.handle.kind === 'directory' ? -1 : 1;
      });

      for (const entry of entries) {
        const node = document.createElement('div');
        node.className = 'tree-node' + (entry.handle.kind === 'directory' ? ' is-dir' : '');
        
        let iconHtml = `<i class="bi bi-${entry.handle.kind === 'directory' ? 'folder' : 'file-text'}"></i>`;
        let titleHtml = `<span class="tree-node-title" title="${entry.name}">${entry.name}</span>`;
        let actionsHtml = `<div class="tree-node-actions">`;
        if (entry.handle.kind === 'directory') {
          actionsHtml += `<button class="tree-node-action-btn" title="New File" data-action="new-file"><i class="bi bi-file-earmark-plus"></i></button>`;
          actionsHtml += `<button class="tree-node-action-btn" title="New Folder" data-action="new-folder"><i class="bi bi-folder-plus"></i></button>`;
        }
        actionsHtml += `<button class="tree-node-action-btn" title="Rename" data-action="rename"><i class="bi bi-pencil"></i></button>`;
        actionsHtml += `<button class="tree-node-action-btn" title="Delete" data-action="delete"><i class="bi bi-trash"></i></button>`;
        actionsHtml += `</div>`;
        
        node.innerHTML = iconHtml + titleHtml + actionsHtml;
        parentEl.appendChild(node);
        
        let childrenCont = null;
        if (entry.handle.kind === 'directory') {
          childrenCont = document.createElement('div');
          childrenCont.className = 'tree-children';
          childrenCont.style.paddingLeft = '16px';
          parentEl.appendChild(childrenCont);
          
          if (AppState.expandedVaultPaths.has(entry.path)) {
            childrenCont.classList.add('expanded');
            node.querySelector('i').className = 'bi bi-folder2-open';
          }
          
          await buildTree(entry.handle, entry.path, childrenCont);
        }

        node.onclick = async (e) => {
          const actionBtn = e.target.closest('.tree-node-action-btn');
          if (actionBtn) {
            e.stopPropagation();
            const action = actionBtn.dataset.action;
            try {
              if (action === 'new-file') {
                let name = prompt('New Markdown File Name:');
                if (name) {
                  if (!name.endsWith('.md')) name += '.md';
                  await entry.handle.getFileHandle(name, { create: true });
                  AppState.expandedVaultPaths.add(entry.path);
                  await renderVaultTree();
                }
              } else if (action === 'new-folder') {
                let name = prompt('New Folder Name:');
                if (name) {
                  await entry.handle.getDirectoryHandle(name, { create: true });
                  AppState.expandedVaultPaths.add(entry.path);
                  await renderVaultTree();
                }
              } else if (action === 'delete') {
                if (confirm('Are you sure you want to delete "' + entry.name + '"?')) {
                  await entry.parentDir.removeEntry(entry.name, { recursive: true });
                  const openTab = AppState.tabs.find(t => t.id === entry.path);
                  if (openTab) {
                    closeTab(openTab.id);
                  }
                  await renderVaultTree();
                }
              } else if (action === 'rename') {
                const titleSpan = node.querySelector('.tree-node-title');
                startInlineRename(titleSpan, entry.name, async (newName) => {
                  if (newName && newName !== entry.name) {
                    const originalHtml = actionBtn.innerHTML;
                    actionBtn.innerHTML = '<i class="bi bi-hourglass-split"></i>';
                    await doVaultRename(entry, newName, () => {
                      titleSpan.replaceWith(titleSpan.cloneNode(true)); // restore on fail
                    });
                  } else {
                    await renderVaultTree(); // restore instantly if unchanged
                  }
                });
              }
            } catch (err) {
              alert('Action failed: ' + err.message);
            }
            return;
          }

          e.stopPropagation();
          if (entry.handle.kind === 'directory') {
            childrenCont.classList.toggle('expanded');
            if (childrenCont.classList.contains('expanded')) {
               AppState.expandedVaultPaths.add(entry.path);
            } else {
               AppState.expandedVaultPaths.delete(entry.path);
            }
            node.querySelector('i').className = `bi bi-${childrenCont.classList.contains('expanded') ? 'folder2-open' : 'folder'}`;
          } else if (entry.name.endsWith('.md')) {
            await openVaultFile(entry);
            document.querySelectorAll('.tree-node').forEach(n => n.classList.remove('active'));
            node.classList.add('active');
          }
        };

        const titleSpan = node.querySelector('.tree-node-title');
        titleSpan.ondblclick = (e) => {
          e.stopPropagation();
          startInlineRename(titleSpan, entry.name, async (newName) => {
            if (newName && newName !== entry.name) {
              await doVaultRename(entry, newName);
            } else {
              await renderVaultTree();
            }
          });
        };

        if (entry.handle.kind === 'file' && entry.name.endsWith('.md')) {
          entry.handle.getFile().then(f => f.text()).then(text => {
            if (AppState.vaultMiniSearch) {
               AppState.vaultMiniSearch.add({ id: entry.path, title: entry.name, path: entry.path, content: text });
            }
          });
        }
      }
    };
    await buildTree(AppState.vaultDirHandle, '', treeEl);
    await checkVirtualSync();
  }

async function checkVirtualSync() {
    const syncBtn = document.getElementById('sync-vault-btn');
    if (!syncBtn) return;
    
    if (AppState.localVaultMode && AppState.vaultDirHandle) {
      try {
        const virtualTabsText = await localforage.getItem("md-preview-tabs");
        const virtualTabs = virtualTabsText ? JSON.parse(virtualTabsText) : [];
        if (virtualTabs && virtualTabs.length > 0) {
          syncBtn.style.display = 'inline-flex';
          syncBtn.onclick = async () => {
            if (!confirm('Import ' + virtualTabs.length + ' virtual notes into your Vault?')) return;
            try {
              for (const t of virtualTabs) {
                const safeTitle = (t.title || 'Untitled').replace(/[\\/:*?"<>|]/g, '-');
                let filename = safeTitle + '.md';
                let fileHandle;
                try {
                  fileHandle = await AppState.vaultDirHandle.getFileHandle(filename, { create: false });
                  // If it doesn't throw, the file exists, so we append a timestamp
                  filename = safeTitle + '_' + Date.now() + '.md';
                  fileHandle = await AppState.vaultDirHandle.getFileHandle(filename, { create: true });
                } catch(e) {
                  // File does not exist, safe to create
                  fileHandle = await AppState.vaultDirHandle.getFileHandle(filename, { create: true });
                }
                const writable = await fileHandle.createWritable();
                await writable.write(t.content || '');
                await writable.close();
              }
              alert('Import successful! Virtual notes are now in your vault.');
              await localforage.removeItem("md-preview-tabs"); // Option: Clean up virtual space since it's imported
              syncBtn.style.display = 'none';
              await renderVaultTree();
            } catch(e) {
              alert('Error importing notes: ' + e.message);
            }
          };
        } else {
          syncBtn.style.display = 'none';
        }
      } catch (e) {
        syncBtn.style.display = 'none';
      }
    } else {
      syncBtn.style.display = 'none';
    }
  }

function bindOpenVaultBtn() {
  const openVaultBtn = document.getElementById('open-vault-btn');
  if (openVaultBtn) {
    openVaultBtn.addEventListener('click', openLocalVault);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bindOpenVaultBtn);
} else {
  bindOpenVaultBtn();
}


