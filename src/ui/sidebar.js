import {
  tocToggleBtn,
  sidebarToc,
  explorerToggleBtn,
  sidebarExplorer,
  tocResizer,
  sidebarResizer,
} from "../core/dom.js";

const MIN_SIDEBAR_WIDTH = 160;
const MAX_SIDEBAR_WIDTH = 600;
const TOC_WIDTH_KEY = "kido-sidebar-toc-width";
const EXPLORER_WIDTH_KEY = "kido-sidebar-explorer-width";

export function initSidebars() {
  // Restore saved widths
  const savedTocWidth = localStorage.getItem(TOC_WIDTH_KEY);
  if (savedTocWidth && sidebarToc) {
    const w = parseInt(savedTocWidth, 10);
    if (w >= MIN_SIDEBAR_WIDTH && w <= MAX_SIDEBAR_WIDTH) {
      sidebarToc.style.width = `${w}px`;
    }
  }

  const savedExplorerWidth = localStorage.getItem(EXPLORER_WIDTH_KEY);
  if (savedExplorerWidth && sidebarExplorer) {
    const w = parseInt(savedExplorerWidth, 10);
    if (w >= MIN_SIDEBAR_WIDTH && w <= MAX_SIDEBAR_WIDTH) {
      sidebarExplorer.style.width = `${w}px`;
    }
  }

  // Toggle buttons
  if (tocToggleBtn && sidebarToc) {
    tocToggleBtn.addEventListener("click", () => {
      sidebarToc.classList.toggle("collapsed");
    });
  }

  if (explorerToggleBtn && sidebarExplorer) {
    explorerToggleBtn.addEventListener("click", () => {
      sidebarExplorer.classList.toggle("collapsed");
    });
  }

  // Left sidebar resizing (TOC)
  const leftResizer = tocResizer || document.getElementById("toc-resizer");
  if (leftResizer && sidebarToc) {
    setupSidebarResizer({
      resizerEl: leftResizer,
      sidebarEl: sidebarToc,
      storageKey: TOC_WIDTH_KEY,
      isRightSide: false,
    });
  }

  // Right sidebar resizing (Explorer)
  const rightResizer = sidebarResizer || document.getElementById("sidebar-resizer");
  if (rightResizer && sidebarExplorer) {
    setupSidebarResizer({
      resizerEl: rightResizer,
      sidebarEl: sidebarExplorer,
      storageKey: EXPLORER_WIDTH_KEY,
      isRightSide: true,
    });
  }
}

function setupSidebarResizer({ resizerEl, sidebarEl, storageKey, isRightSide }) {
  let isDragging = false;
  let startX = 0;
  let startWidth = 0;

  const onPointerDown = (e) => {
    e.preventDefault();
    isDragging = true;
    startX = e.clientX;
    startWidth = sidebarEl.getBoundingClientRect().width;

    resizerEl.classList.add("dragging");
    sidebarEl.classList.add("is-resizing");
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);
  };

  const onPointerMove = (e) => {
    if (!isDragging) return;
    const currentX = e.clientX;
    const deltaX = currentX - startX;

    let newWidth = isRightSide ? startWidth - deltaX : startWidth + deltaX;

    if (newWidth < MIN_SIDEBAR_WIDTH) {
      newWidth = MIN_SIDEBAR_WIDTH;
    } else if (newWidth > MAX_SIDEBAR_WIDTH) {
      newWidth = MAX_SIDEBAR_WIDTH;
    }

    if (sidebarEl.classList.contains("collapsed")) {
      sidebarEl.classList.remove("collapsed");
    }

    sidebarEl.style.width = `${newWidth}px`;
  };

  const onPointerUp = () => {
    if (!isDragging) return;
    isDragging = false;

    resizerEl.classList.remove("dragging");
    sidebarEl.classList.remove("is-resizing");
    document.body.style.cursor = "";
    document.body.style.userSelect = "";

    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", onPointerUp);
    window.removeEventListener("pointercancel", onPointerUp);

    const finalWidth = sidebarEl.getBoundingClientRect().width;
    localStorage.setItem(storageKey, Math.round(finalWidth).toString());
  };

  resizerEl.addEventListener("pointerdown", onPointerDown);
}
