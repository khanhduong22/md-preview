import { markdownEditor } from "./dom.js";
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
      const tabHistory = allHistory.filter(
        (s) => s.tabId === AppState.activeTabId,
      );
      const last =
        tabHistory.length > 0 ? tabHistory[tabHistory.length - 1] : null;

      // Only save if content changed by at least 20 chars or 5% difference
      if (
        !last ||
        Math.abs(content.length - (last.content || "").length) >= 20
      ) {
        const currentTab = AppState.tabs.find(
          (t) => t.id === AppState.activeTabId,
        );
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
