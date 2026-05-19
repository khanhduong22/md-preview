import { tocToggleBtn, sidebarToc, explorerToggleBtn, sidebarExplorer } from "../core/dom.js";

export function initSidebars() {
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
}
