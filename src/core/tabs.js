import { STORAGE_KEY, ACTIVE_TAB_KEY, UNTITLED_COUNTER_KEY, VAULT_HANDLE_KEY, GROUPS_KEY } from "./constants.js";
import { AppState } from './state.js';
import { renderVaultTree } from './vault.js';
import { markdownEditor } from './dom.js';
import { renderMarkdown } from './render.js';
import { syncEditorToPreview, currentViewMode, restoreViewMode } from '../utils/viewMode.js';

  export async function loadTabsFromStorage() {
    try {
      const data = await localforage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  export function saveTabsToStorage(tabsArr) {
    if (AppState.localVaultMode) return; // Do not save entire array into IndexedDB in block when vault is active
    try {
      localforage.setItem(STORAGE_KEY, JSON.stringify(tabsArr));
    } catch (e) {
      console.warn('Failed to save AppState.tabs to localforage:', e);
    }
  }

  export async function loadActiveTabId() {
    return await localforage.getItem(ACTIVE_TAB_KEY);
  }

  export function saveActiveTabId(id) {
    if (AppState.localVaultMode) return;
    localforage.setItem(ACTIVE_TAB_KEY, id);
  }

  export async function loadUntitledCounter() {
    const val = await localforage.getItem(UNTITLED_COUNTER_KEY);
    return parseInt(val || '0', 10);
  }

  export function saveUntitledCounter(val) {
    localforage.setItem(UNTITLED_COUNTER_KEY, String(val));
  }

  export function nextUntitledTitle() {
    untitledCounter += 1;
    saveUntitledCounter(untitledCounter);
    return 'Untitled ' + untitledCounter;
  }

  // ============================================
  // Tab Groups (Chrome-style)
  // ============================================
  
  const GROUP_COLORS = [
    { name: 'gray',   bg: 'rgba(156,163,175,0.25)', border: '#9ca3af', dot: '#9ca3af' },
    { name: 'blue',   bg: 'rgba(59,130,246,0.2)',  border: '#3b82f6', dot: '#3b82f6' },
    { name: 'purple', bg: 'rgba(168,85,247,0.2)',  border: '#a855f7', dot: '#a855f7' },
    { name: 'green',  bg: 'rgba(34,197,94,0.2)',   border: '#22c55e', dot: '#22c55e' },
    { name: 'yellow', bg: 'rgba(234,179,8,0.25)',  border: '#eab308', dot: '#eab308' },
    { name: 'orange', bg: 'rgba(249,115,22,0.2)',  border: '#f97316', dot: '#f97316' },
    { name: 'red',    bg: 'rgba(239,68,68,0.2)',   border: '#ef4444', dot: '#ef4444' },
    { name: 'pink',   bg: 'rgba(236,72,153,0.2)',  border: '#ec4899', dot: '#ec4899' }
  ];

  

  export async function loadGroups() {
    try { 
      const data = await localforage.getItem(GROUPS_KEY);
      return data ? JSON.parse(data) : []; 
    } catch { return []; }
  }

  export function saveGroups() {
    localforage.setItem(GROUPS_KEY, JSON.stringify(AppState.tabGroups));
  }

  export function createGroup(name, colorName) {
    const color = GROUP_COLORS.find(c => c.name === colorName) || GROUP_COLORS[2]; // default purple
    const group = {
      id: 'grp_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      name: name || 'New Group',
      color: color.name,
      collapsed: false
    };
    AppState.tabGroups.push(group);
    saveGroups();
    return group;
  }

  export function deleteGroup(groupId) {
    // Ungroup all AppState.tabs in this group
    AppState.tabs.forEach(t => { if (t.groupId === groupId) t.groupId = null; });
    AppState.tabGroups = AppState.tabGroups.filter(g => g.id !== groupId);
    saveGroups();
    saveTabsToStorage(AppState.tabs);
    renderTabBar(AppState.tabs, AppState.activeTabId);
  }

  export function renameGroup(groupId) {
    const group = AppState.tabGroups.find(g => g.id === groupId);
    if (!group) return;
    const newName = prompt('Rename group:', group.name);
    if (newName === null) return;
    group.name = newName.trim() || 'Unnamed';
    saveGroups();
    renderTabBar(AppState.tabs, AppState.activeTabId);
  }

  export function toggleGroupCollapse(groupId) {
    const group = AppState.tabGroups.find(g => g.id === groupId);
    if (!group) return;
    group.collapsed = !group.collapsed;
    saveGroups();
    renderTabBar(AppState.tabs, AppState.activeTabId);
  }

  export function changeGroupColor(groupId, colorName) {
    const group = AppState.tabGroups.find(g => g.id === groupId);
    if (!group) return;
    group.color = colorName;
    saveGroups();
    renderTabBar(AppState.tabs, AppState.activeTabId);
  }

  export function addTabToGroup(tabId, groupId) {
    const tab = AppState.tabs.find(t => t.id === tabId);
    if (tab) {
      tab.groupId = groupId;
      saveTabsToStorage(AppState.tabs);
      renderTabBar(AppState.tabs, AppState.activeTabId);
    }
  }

  export function removeTabFromGroup(tabId) {
    const tab = AppState.tabs.find(t => t.id === tabId);
    if (tab) {
      tab.groupId = null;
      saveTabsToStorage(AppState.tabs);
      renderTabBar(AppState.tabs, AppState.activeTabId);
    }
  }

  export function getGroupColor(colorName) {
    return GROUP_COLORS.find(c => c.name === colorName) || GROUP_COLORS[0];
  }

  // Load groups on init
  AppState.tabGroups = loadGroups();

  export function createTab(content, title, viewMode) {
    if (content === undefined) content = '';
    if (title === undefined) title = null;
    if (viewMode === undefined) viewMode = 'split';
    return {
      id: 'tab_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8),
      title: title || 'Untitled',
      content: content,
      scrollPos: 0,
      viewMode: viewMode,
      createdAt: Date.now()
    };
  }

  export function renderTabBar(tabsArr, currentActiveTabId) {
    const tabList = document.getElementById('tab-list');
    if (!tabList) return;
    tabList.replaceChildren();

    // Build group submenu HTML for tab context menus
    function buildGroupSubmenu(currentTabGroupId) {
      let html = '<div class="tab-group-submenu">';
      html += '<button class="tab-menu-item" data-action="new-group"><i class="bi bi-folder-plus"></i> New Group</button>';
      if (AppState.tabGroups.length > 0) {
        html += '<div class="tab-ctx-divider"></div>';
        AppState.tabGroups.forEach(g => {
          const gc = getGroupColor(g.color);
          const check = currentTabGroupId === g.id ? ' ✓' : '';
          html += '<button class="tab-menu-item" data-action="add-to-group" data-group-id="' + g.id + '">' +
            '<span class="group-color-dot" style="background:' + gc.dot + '"></span> ' + (g.name || 'Unnamed') + check + '</button>';
        });
      }
      if (currentTabGroupId) {
        html += '<div class="tab-ctx-divider"></div>';
        html += '<button class="tab-menu-item" data-action="remove-from-group"><i class="bi bi-folder-minus"></i> Remove from Group</button>';
      }
      html += '</div>';
      return html;
    }

    // Create a tab DOM element
    function createTabElement(tab, groupColor) {
      const item = document.createElement('div');
      item.className = 'tab-item' + (tab.id === currentActiveTabId ? ' active' : '');
      if (groupColor) {
        item.style.borderBottomColor = groupColor.border;
        item.classList.add('in-group');
      }
      item.setAttribute('data-tab-id', tab.id);
      item.setAttribute('role', 'tab');
      item.setAttribute('aria-selected', tab.id === currentActiveTabId ? 'true' : 'false');
      item.setAttribute('draggable', 'true');

      const titleSpan = document.createElement('span');
      titleSpan.className = 'tab-title';
      titleSpan.textContent = tab.title || 'Untitled';
      
      titleSpan.ondblclick = (e) => {
        e.stopPropagation();
        startInlineRename(titleSpan, tab.title || 'Untitled', async (newName) => {
          if (newName && newName !== tab.title) {
            if (AppState.localVaultMode && tab.handle) {
              const entry = {
                 name: tab.id.split('/').pop(),
                 handle: tab.handle,
                 path: tab.id,
                 parentDir: AppState.vaultDirHandle // approximation for root, not perfect for deep files.
              };
              // Note: Native File Renaming only safely supported at Root with approximation,
              // For full support, tab.parentDir must be stored inside openVaultFile.
              // To prevent bugs, we'll just fall back to standard Virtual Title change if parentDir isn't found
            }
            tab.title = newName;
            saveTabsToStorage(AppState.tabs);
            renderTabBar(AppState.tabs, currentActiveTabId);
          } else {
            renderTabBar(AppState.tabs, currentActiveTabId);
          }
        });
      };
      titleSpan.title = tab.title || 'Untitled';

      const menuBtn = document.createElement('button');
      menuBtn.className = 'tab-menu-btn';
      menuBtn.setAttribute('aria-label', 'File options');
      menuBtn.title = 'File options';
      menuBtn.textContent = '⋯';

      const dropdown = document.createElement('div');
      dropdown.className = 'tab-menu-dropdown';
      dropdown.replaceChildren();
      dropdown.insertAdjacentHTML('beforeend',
        '<button class="tab-menu-item" data-action="pin"><i class="bi bi-pin"></i> <span class="pin-label">' + (tab.pinned ? 'Unpin' : 'Pin') + '</span></button>' +
        '<button class="tab-menu-item" data-action="tag"><i class="bi bi-tag"></i> Tag</button>' +
        '<button class="tab-menu-item tab-menu-item-has-sub" data-action="group-menu"><i class="bi bi-collection"></i> Group <i class="bi bi-chevron-right" style="font-size:10px;margin-left:auto"></i></button>' +
        '<div class="tab-ctx-divider"></div>' +
        '<button class="tab-menu-item" data-action="rename"><i class="bi bi-pencil"></i> Rename</button>' +
        '<button class="tab-menu-item" data-action="duplicate"><i class="bi bi-files"></i> Duplicate</button>' +
        '<button class="tab-menu-item tab-menu-item-danger" data-action="delete"><i class="bi bi-trash"></i> Delete</button>');

      // Group submenu container
      const groupSubContainer = document.createElement('div');
      groupSubContainer.className = 'tab-group-sub-container';
      groupSubContainer.style.display = 'none';
      groupSubContainer.replaceChildren();
      groupSubContainer.insertAdjacentHTML('beforeend', buildGroupSubmenu(tab.groupId));
      dropdown.appendChild(groupSubContainer);

      menuBtn.appendChild(dropdown);

      // Show/hide group submenu on hover
      const groupMenuItem = dropdown.querySelector('[data-action="group-menu"]');
      if (groupMenuItem) {
        groupMenuItem.addEventListener('mouseenter', () => {
          groupSubContainer.style.display = 'block';
          // Position submenu
          const rect = groupMenuItem.getBoundingClientRect();
          groupSubContainer.style.top = (rect.top) + 'px';
          groupSubContainer.style.left = (rect.left - 8) + 'px';
        });
        groupMenuItem.addEventListener('click', (e) => {
          e.stopPropagation();
          groupSubContainer.style.display = groupSubContainer.style.display === 'none' ? 'block' : 'none';
        });
      }
      dropdown.addEventListener('mouseleave', () => {
        groupSubContainer.style.display = 'none';
      });

      // Group submenu actions
      groupSubContainer.querySelectorAll('.tab-menu-item').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          menuBtn.classList.remove('open');
          const action = btn.dataset.action;
          if (action === 'new-group') {
            const name = prompt('Group name:');
            if (name === null) return;
            const group = createGroup(name, 'purple');
            addTabToGroup(tab.id, group.id);
          } else if (action === 'add-to-group') {
            addTabToGroup(tab.id, btn.dataset.groupId);
          } else if (action === 'remove-from-group') {
            removeTabFromGroup(tab.id);
          }
        });
      });

      menuBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        document.querySelectorAll('.tab-menu-btn.open').forEach(function(btn) {
          if (btn !== menuBtn) btn.classList.remove('open');
        });
        menuBtn.classList.toggle('open');
        if (menuBtn.classList.contains('open')) {
          var rect = menuBtn.getBoundingClientRect();
          dropdown.style.top = (rect.bottom + 4) + 'px';
          dropdown.style.right = (window.innerWidth - rect.right) + 'px';
          dropdown.style.left = 'auto';
        }
      });

      dropdown.querySelectorAll(':scope > .tab-menu-item').forEach(function(actionBtn) {
        actionBtn.addEventListener('click', function(e) {
          e.stopPropagation();
          const action = actionBtn.dataset.action;
          if (action === 'group-menu') return; // handled separately
          menuBtn.classList.remove('open');
          if (action === 'rename') renameTab(tab.id);
          else if (action === 'duplicate') duplicateTab(tab.id);
          else if (action === 'delete') deleteTab(tab.id);
          else if (action === 'pin') togglePinTab(tab.id);
          else if (action === 'tag') promptTagTab(tab.id);
        });
      });

      item.appendChild(titleSpan);
      item.appendChild(menuBtn);

      item.addEventListener('click', function() { switchTab(tab.id); });

      item.addEventListener('dragstart', function() {
        draggedTabId = tab.id;
        setTimeout(function() { item.classList.add('dragging'); }, 0);
      });
      item.addEventListener('dragend', function() {
        item.classList.remove('dragging');
        draggedTabId = null;
      });
      item.addEventListener('dragover', function(e) {
        e.preventDefault();
        item.classList.add('drag-over');
      });
      item.addEventListener('dragleave', function() {
        item.classList.remove('drag-over');
      });
      item.addEventListener('drop', function(e) {
        e.preventDefault();
        item.classList.remove('drag-over');
        if (!draggedTabId || draggedTabId === tab.id) return;
        const fromIdx = AppState.tabs.findIndex(t => t.id === draggedTabId);
        const toIdx = AppState.tabs.findIndex(t => t.id === tab.id);
        if (fromIdx === -1 || toIdx === -1) return;
        const moved = AppState.tabs.splice(fromIdx, 1)[0];
        // If dropping onto a grouped tab, add to that group
        if (tab.groupId) moved.groupId = tab.groupId;
        AppState.tabs.splice(toIdx, 0, moved);
        saveTabsToStorage(AppState.tabs);
        renderTabBar(AppState.tabs, AppState.activeTabId);
      });

      return item;
    }

    // Create group header element
    function createGroupHeader(group) {
      const gc = getGroupColor(group.color);
      const header = document.createElement('div');
      header.className = 'tab-group-header' + (group.collapsed ? ' collapsed' : '');
      header.style.setProperty('--group-color', gc.border);
      header.style.setProperty('--group-bg', gc.bg);
      header.setAttribute('data-group-id', group.id);

      header.replaceChildren();
      header.insertAdjacentHTML('beforeend',
        '<span class="group-color-dot" style="background:' + gc.dot + '"></span>' +
        '<span class="group-header-name">' + (group.name || 'Unnamed') + '</span>' +
        '<span class="group-collapse-icon"><i class="bi bi-chevron-' + (group.collapsed ? 'right' : 'down') + '"></i></span>');

      // Click to collapse/expand
      header.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleGroupCollapse(group.id);
      });

      // Double-click to rename
      header.addEventListener('dblclick', (e) => {
        e.stopPropagation();
        renameGroup(group.id);
      });

      // Right-click context menu for group
      header.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        e.stopPropagation();
        // Remove existing group context menus
        document.querySelectorAll('.group-context-menu').forEach(m => m.remove());
        const menu = document.createElement('div');
        menu.className = 'group-context-menu';
        menu.replaceChildren();
        menu.insertAdjacentHTML('beforeend',
          '<button data-action="rename"><i class="bi bi-pencil"></i> Rename</button>' +
          '<div class="tab-ctx-divider"></div>' +
          '<div class="group-color-picker">' +
            GROUP_COLORS.map(c => '<span class="group-color-option' + (c.name === group.color ? ' active' : '') + '" data-color="' + c.name + '" style="background:' + c.dot + '"></span>').join('') +
          '</div>' +
          '<div class="tab-ctx-divider"></div>' +
          '<button class="tab-menu-item-danger" data-action="ungroup"><i class="bi bi-folder-minus"></i> Ungroup All</button>' +
          '<button class="tab-menu-item-danger" data-action="delete-group"><i class="bi bi-trash"></i> Delete Group</button>');

        menu.style.position = 'fixed';
        menu.style.top = e.clientY + 'px';
        menu.style.left = e.clientX + 'px';
        document.body.appendChild(menu);

        menu.querySelectorAll('button').forEach(btn => {
          btn.addEventListener('click', (ev) => {
            ev.stopPropagation();
            menu.remove();
            const act = btn.dataset.action;
            if (act === 'rename') renameGroup(group.id);
            else if (act === 'ungroup') deleteGroup(group.id);
            else if (act === 'delete-group') {
              // Delete group AND close its AppState.tabs
              const groupTabs = AppState.tabs.filter(t => t.groupId === group.id);
              groupTabs.forEach(t => deleteTab(t.id));
              AppState.tabGroups = AppState.tabGroups.filter(g => g.id !== group.id);
              saveGroups();
              renderTabBar(AppState.tabs, AppState.activeTabId);
            }
          });
        });

        menu.querySelectorAll('.group-color-option').forEach(opt => {
          opt.addEventListener('click', (ev) => {
            ev.stopPropagation();
            menu.remove();
            changeGroupColor(group.id, opt.dataset.color);
          });
        });

        // Close on click outside
        const closeMenu = () => { menu.remove(); document.removeEventListener('click', closeMenu); };
        setTimeout(() => document.addEventListener('click', closeMenu), 0);
      });

      // Drop onto group header = add to group
      header.addEventListener('dragover', (e) => {
        e.preventDefault();
        header.classList.add('drag-over');
      });
      header.addEventListener('dragleave', () => {
        header.classList.remove('drag-over');
      });
      header.addEventListener('drop', (e) => {
        e.preventDefault();
        header.classList.remove('drag-over');
        if (draggedTabId) {
          addTabToGroup(draggedTabId, group.id);
        }
      });

      return header;
    }

    // Render: groups first, then ungrouped AppState.tabs
    AppState.tabGroups.forEach(group => {
      const groupTabs = tabsArr.filter(t => t.groupId === group.id);
      if (groupTabs.length === 0) return; // skip empty groups

      const gc = getGroupColor(group.color);
      tabList.appendChild(createGroupHeader(group));

      if (!group.collapsed) {
        groupTabs.forEach(tab => {
          tabList.appendChild(createTabElement(tab, gc));
        });
      }
    });

    // Ungrouped AppState.tabs
    const ungroupedTabs = tabsArr.filter(t => !t.groupId || !AppState.tabGroups.some(g => g.id === t.groupId));
    ungroupedTabs.forEach(tab => {
      tabList.appendChild(createTabElement(tab, null));
    });

    // "+" button
    const newBtn = document.createElement('button');
    newBtn.className = 'tab-new-btn';
    newBtn.title = 'New Tab (Ctrl+T)';
    newBtn.setAttribute('aria-label', 'Open new tab');
    newBtn.replaceChildren();
    const icon = document.createElement('i');
    icon.className = 'bi bi-plus-lg';
    newBtn.appendChild(icon);
    newBtn.addEventListener('click', function() { newTab(); });
    tabList.appendChild(newBtn);

    // Auto-scroll active tab into view
    const activeItem = tabList.querySelector('.tab-item.active');
    if (activeItem) {
      activeItem.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }

    renderMobileTabList(tabsArr, currentActiveTabId);
  }

  export function renderMobileTabList(tabsArr, currentActiveTabId) {
    const mobileTabList = document.getElementById('mobile-tab-list');
    if (!mobileTabList) return;
    mobileTabList.replaceChildren();
    tabsArr.forEach(function(tab) {
      const item = document.createElement('div');
      item.className = 'mobile-tab-item' + (tab.id === currentActiveTabId ? ' active' : '');
      item.setAttribute('role', 'tab');
      item.setAttribute('aria-selected', tab.id === currentActiveTabId ? 'true' : 'false');
      item.setAttribute('data-tab-id', tab.id);

      const titleSpan = document.createElement('span');
      titleSpan.className = 'mobile-tab-title';
      titleSpan.textContent = tab.title || 'Untitled';
      titleSpan.title = tab.title || 'Untitled';

      // Three-dot menu button (same as desktop)
      const menuBtn = document.createElement('button');
      menuBtn.className = 'tab-menu-btn';
      menuBtn.setAttribute('aria-label', 'File options');
      menuBtn.title = 'File options';
      menuBtn.textContent = '⋯';

      // Dropdown (same as desktop)
      const dropdown = document.createElement('div');
      dropdown.className = 'tab-menu-dropdown';
      dropdown.replaceChildren();
      dropdown.insertAdjacentHTML('beforeend',
        '<button class="tab-menu-item" data-action="rename"><i class="bi bi-pencil"></i> Rename</button>' +
        '<button class="tab-menu-item" data-action="duplicate"><i class="bi bi-files"></i> Duplicate</button>' +
        '<button class="tab-menu-item tab-menu-item-danger" data-action="delete"><i class="bi bi-trash"></i> Delete</button>');

      menuBtn.appendChild(dropdown);

      menuBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        document.querySelectorAll('.tab-menu-btn.open').forEach(function(btn) {
          if (btn !== menuBtn) btn.classList.remove('open');
        });
        menuBtn.classList.toggle('open');
        if (menuBtn.classList.contains('open')) {
          const rect = menuBtn.getBoundingClientRect();
          dropdown.style.top = (rect.bottom + 4) + 'px';
          dropdown.style.right = (window.innerWidth - rect.right) + 'px';
          dropdown.style.left = 'auto';
        }
      });

      dropdown.querySelectorAll('.tab-menu-item').forEach(function(actionBtn) {
        actionBtn.addEventListener('click', function(e) {
          e.stopPropagation();
          menuBtn.classList.remove('open');
          const action = actionBtn.getAttribute('data-action');
          if (action === 'rename') {
            closeMobileMenu();
            renameTab(tab.id);
          } else if (action === 'duplicate') {
            duplicateTab(tab.id);
            closeMobileMenu();
          } else if (action === 'delete') {
            deleteTab(tab.id);
          }
        });
      });

      item.appendChild(titleSpan);
      item.appendChild(menuBtn);

      item.addEventListener('click', function() {
        switchTab(tab.id);
        closeMobileMenu();
      });

      mobileTabList.appendChild(item);
    });
  }

  // Close any open tab dropdown when clicking elsewhere in the document
  document.addEventListener('click', function() {
    document.querySelectorAll('.tab-menu-btn.open').forEach(function(btn) {
      btn.classList.remove('open');
    });
  });

  export async function saveCurrentTabState(forceVaultSave = false) {
    const tab = AppState.tabs.find(function(t) { return t.id === AppState.activeTabId; });
    if (!tab) return;
    tab.content = markdownEditor.value;
    tab.scrollPos = markdownEditor.scrollTop;
    tab.viewMode = currentViewMode || 'split';
    
    if (tab.handle && forceVaultSave === true) {
      try {
        const writable = await tab.handle.createWritable();
        await writable.write(tab.content);
        await writable.close();
        if (AppState.vaultMiniSearch) {
          AppState.vaultMiniSearch.add({ id: tab.id, title: tab.title, path: tab.path, content: tab.content });
        }
      } catch(e) {
        console.error('Failed to write cleanly to vault:', e);
      }
    } else if (!tab.handle) {
      saveTabsToStorage(AppState.tabs);
    }
  }

  export async function switchTab(tabId) {
    if (tabId === AppState.activeTabId && !AppState.localVaultMode) return;
    await saveCurrentTabState(true);
    AppState.activeTabId = tabId;
    saveActiveTabId(AppState.activeTabId);
    const tab = AppState.tabs.find(function(t) { return t.id === tabId; });
    if (!tab) return;
    
    if (tab.handle && !tab.content) {
      try {
        const file = await tab.handle.getFile();
        tab.content = await file.text();
      } catch(e) {
        tab.content = 'Error reading file';
      }
    }
    
    markdownEditor.value = tab.content || '';
    restoreViewMode(tab.viewMode);
    renderMarkdown();
    requestAnimationFrame(function() {
      markdownEditor.scrollTop = tab.scrollPos || 0;
    });
    renderTabBar(AppState.tabs, AppState.activeTabId);
  }

  export function newTab(content, title) {
    if (content === undefined) content = '';
    if (!title) title = nextUntitledTitle();
    const tab = createTab(content, title);
    tab.createdAt = Date.now(); // Track creation time for auto-save feature
    AppState.tabs.push(tab);
    switchTab(tab.id);
    markdownEditor.focus();
  }
  export function closeTab(tabId) {
    const idx = AppState.tabs.findIndex(function(t) { return t.id === tabId; });
    if (idx === -1) return;
    AppState.tabs.splice(idx, 1);
    if (AppState.tabs.length === 0) {
      // Auto-create new "Untitled" when last tab is deleted
      const newT = createTab('', nextUntitledTitle());
      AppState.tabs.push(newT);
      AppState.activeTabId = newT.id;
      saveActiveTabId(AppState.activeTabId);
      markdownEditor.value = '';
      restoreViewMode('split');
      renderMarkdown();
    } else if (AppState.activeTabId === tabId) {
      const newIdx = Math.max(0, idx - 1);
      AppState.activeTabId = AppState.tabs[newIdx].id;
      saveActiveTabId(AppState.activeTabId);
      const newActiveTab = AppState.tabs[newIdx];
      markdownEditor.value = newActiveTab.content;
      restoreViewMode(newActiveTab.viewMode);
      renderMarkdown();
      requestAnimationFrame(function() {
        markdownEditor.scrollTop = newActiveTab.scrollPos || 0;
      });
    }
    saveTabsToStorage(AppState.tabs);
    renderTabBar(AppState.tabs, AppState.activeTabId);
  }

  export function deleteTab(tabId) {
    closeTab(tabId);
  }

  export function renameTab(tabId) {
    const tab = AppState.tabs.find(function(t) { return t.id === tabId; });
    if (!tab) return;
    const modal = document.getElementById('rename-modal');
    const input = document.getElementById('rename-modal-input');
    const confirmBtn = document.getElementById('rename-modal-confirm');
    const cancelBtn = document.getElementById('rename-modal-cancel');
    if (!modal || !input) return;
    input.value = tab.title;
    modal.style.display = 'flex';
    input.focus();
    input.select();

    function doRename() {
      const newName = input.value.trim();
      if (newName) {
        tab.title = newName;
        saveTabsToStorage(AppState.tabs);
        renderTabBar(AppState.tabs, AppState.activeTabId);
      }
      modal.style.display = 'none';
      cleanup();
    }

    function cleanup() {
      confirmBtn.removeEventListener('click', doRename);
      cancelBtn.removeEventListener('click', doCancel);
      input.removeEventListener('keydown', onKey);
    }

    function doCancel() {
      modal.style.display = 'none';
      cleanup();
    }

    function onKey(e) {
      if (e.key === 'Enter') doRename();
      else if (e.key === 'Escape') doCancel();
    }

    confirmBtn.addEventListener('click', doRename);
    cancelBtn.addEventListener('click', doCancel);
    input.addEventListener('keydown', onKey);
  }

  export function duplicateTab(tabId) {
    const tab = AppState.tabs.find(function(t) { return t.id === tabId; });
    if (!tab) return;
    saveCurrentTabState(true);
    const dupTitle = tab.title + ' (copy)';
    const dup = createTab(tab.content, dupTitle, tab.viewMode);
    if (tab.groupId) dup.groupId = tab.groupId;
    const idx = AppState.tabs.findIndex(function(t) { return t.id === tabId; });
    AppState.tabs.splice(idx + 1, 0, dup);
    switchTab(dup.id);
  }

  export function resetAllTabs() {
    const modal = document.getElementById('reset-confirm-modal');
    const confirmBtn = document.getElementById('reset-modal-confirm');
    const cancelBtn = document.getElementById('reset-modal-cancel');
    const title = document.getElementById('reset-modal-title');
    if (!modal) return;
    
    if (AppState.localVaultMode) {
      title.textContent = "Close all AppState.tabs? (Local files will NOT be deleted)";
      confirmBtn.textContent = "Close All";
    } else {
      title.textContent = "Are you sure you want to delete all virtual files and reset to default?";
      confirmBtn.textContent = "Delete & Reset";
    }
    
    modal.style.display = 'flex';

    function doReset() {
      modal.style.display = 'none';
      cleanup();
      AppState.tabs = [];
      AppState.tabGroups = [];
      saveGroups();
      untitledCounter = 0;
      saveUntitledCounter(0);
      
      if (!AppState.localVaultMode) {
        const welcome = createTab(sampleMarkdown, 'Welcome to Markdown');
        AppState.tabs.push(welcome);
        
        if (typeof demo30ChartsMarkdown !== 'undefined') {
          const demoGroup = createGroup('demo', 'purple');
          const demoTab = createTab(demo30ChartsMarkdown, '30 chart');
          demoTab.groupId = demoGroup.id;
          AppState.tabs.push(demoTab);
        }
        
        AppState.activeTabId = welcome.id;
        markdownEditor.value = sampleMarkdown;
      } else {
        AppState.activeTabId = null;
        markdownEditor.value = '';
      }
      
      saveActiveTabId(AppState.activeTabId);
      saveTabsToStorage(AppState.tabs);
      restoreViewMode('split');
      renderMarkdown();
      renderTabBar(AppState.tabs, AppState.activeTabId);
      
      // Force clean URL hash (remove #share=...)
      if (window.history && window.history.replaceState) {
        window.history.replaceState(null, null, window.location.pathname);
      } else {
        window.location.hash = '';
      }
    }

    function doCancel() {
      modal.style.display = 'none';
      cleanup();
    }

    function cleanup() {
      confirmBtn.removeEventListener('click', doReset);
      cancelBtn.removeEventListener('click', doCancel);
    }

    confirmBtn.addEventListener('click', doReset);
    cancelBtn.addEventListener('click', doCancel);
  }

// ========================================
// 3. PIN & FAVORITES
// ========================================
export function togglePinTab(tabId) {
  const tab = AppState.tabs.find((t) => t.id === tabId);
  if (!tab) return;
  tab.pinned = !tab.pinned;
  saveTabsToStorage(AppState.tabs);
  renderTabBar(AppState.tabs, AppState.activeTabId);
}

// Sort AppState.tabs: pinned first

  typeof renderTabList === "function" ? renderTabList : null;
// We'll handle pinned sorting inside renderTabList by sorting the AppState.tabs array before rendering