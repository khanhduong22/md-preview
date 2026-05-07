import { HISTORY_KEY } from "./constants.js";
import { AppState } from './state.js';
import { markdownEditor } from './dom.js';

  // 5. VERSION HISTORY
  // ========================================
  
  let appHistory = [];
  const historyBtn = document.getElementById('history-btn');
  const historyPanel = document.getElementById('history-panel');
  const historyOverlay = document.getElementById('history-overlay');
  const historyClose = document.getElementById('history-close');
  const historyListEl = document.getElementById('history-list');
  const historyDiffView = document.getElementById('history-diff-view');
  const historyDiffContent = document.getElementById('history-diff-content');
  const historyDiffTitle = document.getElementById('history-diff-title');
  const historyBack = document.getElementById('history-back');

  export async function initHistory() {
    try { 
      const data = await localforage.getItem(HISTORY_KEY);
      appHistory = data ? JSON.parse(data) : [];
    } catch { 
      appHistory = []; 
    }
  }

  export function loadHistory() {
    return appHistory;
  }

  export function saveHistory(history) {
    appHistory = history;
    localforage.setItem(HISTORY_KEY, JSON.stringify(history)).catch(e => console.warn(e));
  }

  export function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  /** Called when user shares — saves a snapshot */
  export function saveShareSnapshot(content, title) {
    const history = loadHistory();
    const tabSnapshots = history.filter(s => s.tabId === AppState.activeTabId);
    const lastSnapshot = tabSnapshots.length > 0 ? tabSnapshots[tabSnapshots.length - 1] : null;
    const snapshot = {
      id: generateId(),
      tabId: AppState.activeTabId,
      title: title || 'Untitled',
      content: content,
      timestamp: Date.now(),
      parentId: lastSnapshot ? lastSnapshot.id : null
    };
    history.push(snapshot);
    // Keep max 200 snapshots total
    if (history.length > 200) history.splice(0, history.length - 200);
    saveHistory(history);
    return snapshot;
  }

  export function openHistory() {
    if (!historyPanel) return;
    const allHistory = loadHistory();
    // Only show snapshots for the current tab (filter by tabId; fall back to all for old entries)
    const history = allHistory.filter(s => !s.tabId || s.tabId === AppState.activeTabId);
    historyDiffView.style.display = 'none';
    historyListEl.style.display = 'block';

    // Show current tab name in panel header
    const currentTab = AppState.tabs.find(t => t.id === AppState.activeTabId);
    const panelTitle = historyPanel.querySelector('h3');
    if (panelTitle) {
      panelTitle.innerHTML = '<i class="bi bi-clock-history"></i> ' +
        (currentTab ? currentTab.title : 'Version') + ' History';
    }

    if (history.length === 0) {
      historyListEl.innerHTML = '<div class="history-empty">No history for this note yet.<br>Share it to start tracking versions.</div>';
    } else {
      historyListEl.innerHTML = history.slice().reverse().map(s => {
        const date = new Date(s.timestamp);
        const timeStr = date.toLocaleString();
        const parentInfo = s.parentId ? '<span class="has-parent"><i class="bi bi-git"></i> has parent</span>' : '';
        const chars = s.content ? s.content.length + ' chars' : '';
        return '<div class="history-item" data-id="' + s.id + '">' +
          '<div class="history-item-title">' + (s.title || 'Untitled') + '</div>' +
          '<div class="history-item-meta"><span>' + timeStr + '</span><span>' + chars + '</span>' + parentInfo + '</div></div>';
      }).join('');

      historyListEl.querySelectorAll('.history-item').forEach(item => {
        item.addEventListener('click', () => {
          const snapId = item.dataset.id;
          showHistoryDiff(snapId);
        });
      });
    }

    historyPanel.style.display = 'flex';
    historyOverlay.style.display = 'block';
  }

  export function closeHistory() {
    if (historyPanel) historyPanel.style.display = 'none';
    if (historyOverlay) historyOverlay.style.display = 'none';
  }

  export function showHistoryDiff(snapId) {
    const history = loadHistory();
    const snap = history.find(s => s.id === snapId);
    if (!snap) return;

    const parent = snap.parentId ? history.find(s => s.id === snap.parentId) : null;

    historyListEl.style.display = 'none';
    historyDiffView.style.display = 'flex';

    if (!parent) {
      historyDiffTitle.textContent = 'First version — ' + (snap.title || 'Untitled');
      historyDiffContent.innerHTML = snap.content.split('\n').map(
        line => '<div class="diff-line diff-added">+ ' + escapeHtml(line) + '</div>'
      ).join('');
      return;
    }

    historyDiffTitle.textContent = 'Changes from previous version';

    if (typeof Diff !== 'undefined' && Diff.diffLines) {
      const diff = Diff.diffLines(parent.content || '', snap.content || '');
      historyDiffContent.innerHTML = diff.map(part => {
        const lines = part.value.split('\n').filter((l, i, arr) => i < arr.length - 1 || l !== '');
        const cls = part.added ? 'diff-added' : part.removed ? 'diff-removed' : 'diff-unchanged';
        const prefix = part.added ? '+ ' : part.removed ? '- ' : '  ';
        return lines.map(line => '<div class="diff-line ' + cls + '">' + prefix + escapeHtml(line) + '</div>').join('');
      }).join('');
    } else {
      historyDiffContent.innerHTML = '<div class="history-empty">Diff library not loaded</div>';
    }
  }

  export function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  export function initHistoryUI() {
  if (historyBtn) historyBtn.addEventListener('click', openHistory);
    if (historyClose) historyClose.addEventListener('click', closeHistory);
    if (historyOverlay) historyOverlay.addEventListener('click', closeHistory);
    if (historyBack) {
      historyBack.addEventListener('click', () => {
        historyDiffView.style.display = 'none';
        historyListEl.style.display = 'block';
      });
    }
  
    // Drag-to-resize history panel
    const historyResizeHandle = document.getElementById('history-resize-handle');
    if (historyResizeHandle && historyPanel) {
      let isResizing = false;
      let startX = 0;
      let startWidth = 0;
  
      historyResizeHandle.addEventListener('mousedown', (e) => {
        isResizing = true;
        startX = e.clientX;
        startWidth = historyPanel.offsetWidth;
        historyResizeHandle.classList.add('dragging');
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
        e.preventDefault();
      });
  
      document.addEventListener('mousemove', (e) => {
        if (!isResizing) return;
        const dx = startX - e.clientX; // dragging left = wider
        const newWidth = Math.min(Math.max(startWidth + dx, 280), window.innerWidth * 0.8);
        historyPanel.style.width = newWidth + 'px';
      });
  
      document.addEventListener('mouseup', () => {
        if (isResizing) {
          isResizing = false;
          historyResizeHandle.classList.remove('dragging');
          document.body.style.cursor = '';
          document.body.style.userSelect = '';
        }
      });
    }
  
    // Hook into share: save snapshot on every share
    
  
    // ========================================
}
