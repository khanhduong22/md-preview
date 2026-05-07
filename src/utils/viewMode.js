import { renderMarkdown } from "../core/render.js";

const mobileToggleSync = document.getElementById("mobile-toggle-sync");
const contentContainer = document.querySelector(".content-container");
const viewModeButtons = document.querySelectorAll(
  ".view-mode-btn:not(.focus-mode-toggle-btn)",
);
const mobileViewModeButtons = document.querySelectorAll(
  ".mobile-view-mode-btn",
);
const resizeDivider = document.querySelector(".resize-divider");
const editorPaneElement = document.querySelector(".editor-pane");
const previewPaneElement = document.querySelector(".preview-pane");

export let syncScrollingEnabled = true;
let isEditorScrolling = false;
let isPreviewScrolling = false;
let scrollSyncTimeout = null;
const SCROLL_SYNC_DELAY = 10;

export let currentViewMode = "split";
export let isSplitReversed = false;
let isResizing = false;
let editorWidthPercent = 50;
const MIN_PANE_PERCENT = 20;

export function syncEditorToPreview() {
  if (!syncScrollingEnabled || isPreviewScrolling) return;

  isEditorScrolling = true;
  clearTimeout(scrollSyncTimeout);

  scrollSyncTimeout = setTimeout(() => {
    const editorScrollRatio =
      editorPane.scrollTop /
      (editorPane.scrollHeight - editorPane.clientHeight);
    const previewScrollPosition =
      (previewPane.scrollHeight - previewPane.clientHeight) * editorScrollRatio;

    if (!isNaN(previewScrollPosition) && isFinite(previewScrollPosition)) {
      previewPane.scrollTop = previewScrollPosition;
    }

    setTimeout(() => {
      isEditorScrolling = false;
    }, 50);
  }, SCROLL_SYNC_DELAY);
}

export function syncPreviewToEditor() {
  if (!syncScrollingEnabled || isEditorScrolling) return;

  isPreviewScrolling = true;
  clearTimeout(scrollSyncTimeout);

  scrollSyncTimeout = setTimeout(() => {
    const previewScrollRatio =
      previewPane.scrollTop /
      (previewPane.scrollHeight - previewPane.clientHeight);
    const editorScrollPosition =
      (editorPane.scrollHeight - editorPane.clientHeight) * previewScrollRatio;

    if (!isNaN(editorScrollPosition) && isFinite(editorScrollPosition)) {
      editorPane.scrollTop = editorScrollPosition;
    }

    setTimeout(() => {
      isPreviewScrolling = false;
    }, 50);
  }, SCROLL_SYNC_DELAY);
}

export function toggleSyncScrolling() {
  syncScrollingEnabled = !syncScrollingEnabled;
  if (syncScrollingEnabled) {
    toggleSyncButton.innerHTML = '<i class="bi bi-link-45deg"></i> Sync Off';
    toggleSyncButton.classList.add("sync-disabled");
    toggleSyncButton.classList.remove("sync-enabled");
    toggleSyncButton.classList.add("border-primary");
  } else {
    toggleSyncButton.innerHTML = '<i class="bi bi-link"></i> Sync On';
    toggleSyncButton.classList.add("sync-enabled");
    toggleSyncButton.classList.remove("sync-disabled");
    toggleSyncButton.classList.remove("border-primary");
  }
}

export function setViewMode(mode) {
  if (!mode || !["editor", "split", "preview"].includes(mode)) return;

  if (mode === "split" && currentViewMode === "split") {
    isSplitReversed = !isSplitReversed;
    contentContainer.classList.remove(
      "view-editor-only",
      "view-preview-only",
      "view-split",
      "view-split-reversed",
    );
    contentContainer.classList.add(
      isSplitReversed ? "view-split-reversed" : "view-split",
    );
    applyPaneWidths();
    return;
  }

  if (mode === currentViewMode) return;

  const previousMode = currentViewMode;
  currentViewMode = mode;

  // Update content container class
  contentContainer.classList.remove(
    "view-editor-only",
    "view-preview-only",
    "view-split",
    "view-split-reversed",
  );
  contentContainer.classList.add(
    mode === "editor"
      ? "view-editor-only"
      : mode === "preview"
        ? "view-preview-only"
        : isSplitReversed
          ? "view-split-reversed"
          : "view-split",
  );

  // Update button active states (desktop)
  viewModeButtons.forEach((btn) => {
    const btnMode = btn.getAttribute("data-mode");
    if (btnMode === mode) {
      btn.classList.add("active");
      btn.setAttribute("aria-pressed", "true");
    } else {
      btn.classList.remove("active");
      btn.setAttribute("aria-pressed", "false");
    }
  });

  // Story 1.4: Update mobile button active states
  mobileViewModeButtons.forEach((btn) => {
    const btnMode = btn.getAttribute("data-mode");
    if (btnMode === mode) {
      btn.classList.add("active");
      btn.setAttribute("aria-pressed", "true");
    } else {
      btn.classList.remove("active");
      btn.setAttribute("aria-pressed", "false");
    }
  });

  // Story 1.2: Show/hide sync toggle based on view mode
  updateSyncToggleVisibility(mode);

  // Story 1.3: Handle pane widths when switching modes
  if (mode === "split") {
    // Restore preserved pane widths when entering split mode
    applyPaneWidths();
  } else if (previousMode === "split") {
    // Reset pane widths when leaving split mode
    resetPaneWidths();
  }

  // Re-render markdown when switching to a view that includes preview
  if (mode === "split" || mode === "preview") {
    renderMarkdown();
  }
}

export function updateSyncToggleVisibility(mode) {
  const isSplitView = mode === "split";

  // Desktop sync toggle
  if (toggleSyncButton) {
    toggleSyncButton.style.display = isSplitView ? "" : "none";
    toggleSyncButton.setAttribute("aria-hidden", !isSplitView);
  }

  // Mobile sync toggle
  if (mobileToggleSync) {
    mobileToggleSync.style.display = isSplitView ? "" : "none";
    mobileToggleSync.setAttribute("aria-hidden", !isSplitView);
  }
}

export function initResizer() {
  if (!resizeDivider) return;

  resizeDivider.addEventListener("mousedown", startResize);
  document.addEventListener("mousemove", handleResize);
  document.addEventListener("mouseup", stopResize);

  // Touch support for tablets (though disabled via CSS, keeping for future)
  resizeDivider.addEventListener("touchstart", startResizeTouch);
  document.addEventListener("touchmove", handleResizeTouch);
  document.addEventListener("touchend", stopResize);
}

export function startResize(e) {
  if (currentViewMode !== "split") return;
  e.preventDefault();
  isResizing = true;
  resizeDivider.classList.add("dragging");
  document.body.classList.add("resizing");
}

export function startResizeTouch(e) {
  if (currentViewMode !== "split") return;
  e.preventDefault();
  isResizing = true;
  resizeDivider.classList.add("dragging");
  document.body.classList.add("resizing");
}

export function handleResize(e) {
  if (!isResizing) return;

  const containerRect = contentContainer.getBoundingClientRect();
  const containerWidth = containerRect.width;
  const mouseX = e.clientX - containerRect.left;

  // Calculate percentage
  let newEditorPercent = (mouseX / containerWidth) * 100;

  // Enforce minimum pane widths
  newEditorPercent = Math.max(
    MIN_PANE_PERCENT,
    Math.min(100 - MIN_PANE_PERCENT, newEditorPercent),
  );

  if (isSplitReversed) {
    editorWidthPercent = 100 - newEditorPercent;
  } else {
    editorWidthPercent = newEditorPercent;
  }
  applyPaneWidths();
}

export function handleResizeTouch(e) {
  if (!isResizing || !e.touches[0]) return;

  const containerRect = contentContainer.getBoundingClientRect();
  const containerWidth = containerRect.width;
  const touchX = e.touches[0].clientX - containerRect.left;

  let newEditorPercent = (touchX / containerWidth) * 100;
  newEditorPercent = Math.max(
    MIN_PANE_PERCENT,
    Math.min(100 - MIN_PANE_PERCENT, newEditorPercent),
  );

  if (isSplitReversed) {
    editorWidthPercent = 100 - newEditorPercent;
  } else {
    editorWidthPercent = newEditorPercent;
  }
  applyPaneWidths();
}

export function stopResize() {
  if (!isResizing) return;
  isResizing = false;
  resizeDivider.classList.remove("dragging");
  document.body.classList.remove("resizing");
}

export function applyPaneWidths() {
  if (currentViewMode !== "split") return;

  const previewPercent = 100 - editorWidthPercent;
  editorPaneElement.style.flex = `0 0 calc(${editorWidthPercent}% - 4px)`;
  previewPaneElement.style.flex = `0 0 calc(${previewPercent}% - 4px)`;
}

export function resetPaneWidths() {
  editorPaneElement.style.flex = "";
  previewPaneElement.style.flex = "";
}

export function toggleFocusMode() {
  isFocusMode = !isFocusMode;
  if (isFocusMode) {
    document.body.classList.add("focus-mode");
  } else {
    document.body.classList.remove("focus-mode");
  }
}

if (focusModeBtn) focusModeBtn.addEventListener("click", toggleFocusMode);
if (exitFocusBtn) exitFocusBtn.addEventListener("click", toggleFocusMode);

import { editorPane, previewPane, toggleSyncButton } from "../core/dom.js";
import { saveCurrentTabState } from "../core/tabs.js";

export function initViewModeUI() {
  const viewModeButtons = document.querySelectorAll(
    ".view-mode-btn:not(.focus-mode-toggle-btn)",
  );

  viewModeButtons.forEach((btn) => {
    btn.addEventListener("click", function () {
      const mode = this.getAttribute("data-mode");
      setViewMode(mode);
      saveCurrentTabState();
    });
  });

  if (editorPane) editorPane.addEventListener("scroll", syncEditorToPreview);
  if (previewPane) previewPane.addEventListener("scroll", syncPreviewToEditor);
  if (toggleSyncButton)
    toggleSyncButton.addEventListener("click", toggleSyncScrolling);

  initResizer();
}
