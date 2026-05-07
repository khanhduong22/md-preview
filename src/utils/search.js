
import { AppState } from '../core/state.js';
import { openVaultFile } from '../core/vault.js';
import { switchTab, loadTabsFromStorage } from '../core/tabs.js';

// ========================================
// 2. SEARCH
// ========================================
const searchBtn = document.getElementById("search-btn");
const searchOverlay = document.getElementById("search-overlay");
const searchInput = document.getElementById("search-input");
const searchResults = document.getElementById("search-results");

function openSearch() {
  if (!searchOverlay) return;
  searchOverlay.style.display = "flex";
  setTimeout(() => searchInput.focus(), 50);
}

function closeSearch() {
  if (!searchOverlay) return;
  searchOverlay.style.display = "none";
  searchInput.value = "";
  searchResults.innerHTML =
    '<div class="search-empty">Type to search across all your notes</div>';
}

async function performSearch(query) {
  if (!query || query.length < 2) {
    searchResults.innerHTML =
      '<div class="search-empty">Type to search across all your notes</div>';
    return;
  }

  let matches = [];
  const lowerQuery = query.toLowerCase();

  if (AppState.localVaultMode && AppState.vaultMiniSearch) {
    const results = AppState.vaultMiniSearch.search(query, {
      prefix: true,
      fuzzy: 0.2,
    });
    matches = results.map((r) => {
      return {
        id: r.id,
        title: r.title || r.id.split("/").pop(),
        content: r.content || "",
        pinned: false,
      };
    });
  } else {
    const allTabs = await loadTabsFromStorage();
    matches = allTabs.filter(
      (t) =>
        (t.title && t.title.toLowerCase().includes(lowerQuery)) ||
        (t.content && t.content.toLowerCase().includes(lowerQuery)),
    );
  }

  if (matches.length === 0) {
    searchResults.innerHTML =
      '<div class="search-empty">No results found</div>';
    return;
  }

  searchResults.innerHTML = matches
    .map((t) => {
      const pinnedIcon = t.pinned
        ? '<i class="bi bi-star-fill pinned-icon"></i>'
        : "";
      let snippet = "";
      if (t.content) {
        const idx = t.content.toLowerCase().indexOf(lowerQuery);
        if (idx >= 0) {
          const start = Math.max(0, idx - 40);
          const end = Math.min(t.content.length, idx + query.length + 40);
          const before = t.content.slice(start, idx);
          const match = t.content.slice(idx, idx + query.length);
          const after = t.content.slice(idx + query.length, end);
          snippet =
            (start > 0 ? "…" : "") +
            before +
            "<mark>" +
            match +
            "</mark>" +
            after +
            (end < t.content.length ? "…" : "");
        } else {
          snippet = t.content.slice(0, 80) + (t.content.length > 80 ? "…" : "");
        }
      }
      return (
        '<div class="search-result-item" data-tab-id="' +
        t.id +
        '">' +
        '<div class="search-result-title">' +
        pinnedIcon +
        (t.title || "Untitled") +
        "</div>" +
        '<div class="search-result-snippet">' +
        snippet +
        "</div></div>"
      );
    })
    .join("");

  searchResults.querySelectorAll(".search-result-item").forEach((item) => {
    item.addEventListener("click", async () => {
      const tabId = item.dataset.tabId;
      const query = searchInput ? searchInput.value.trim() : "";

      if (AppState.localVaultMode) {
        // Find entry
        const entry = AppState.vaultEntries
          ? AppState.vaultEntries.find((e) => e.path === tabId)
          : null;
        if (entry) {
          await openVaultFile(entry);
        }
      } else {
        await switchTab(tabId);
      }
      closeSearch();

      // Scroll preview pane to first match after render settles
      if (query) {
        setTimeout(() => {
          const previewPane = document.getElementById("preview-content");
          if (!previewPane) return;
          // Find all text nodes and highlight first match
          const walker = document.createTreeWalker(
            previewPane,
            NodeFilter.SHOW_TEXT,
          );
          const lowerQuery = query.toLowerCase();
          let node;
          while ((node = walker.nextNode())) {
            const idx = node.nodeValue.toLowerCase().indexOf(lowerQuery);
            if (idx !== -1) {
              // Wrap match in a temporary highlight span
              const range = document.createRange();
              range.setStart(node, idx);
              range.setEnd(node, idx + query.length);
              const mark = document.createElement("mark");
              mark.className = "search-scroll-highlight";
              mark.style.cssText =
                "background:rgba(168,85,247,0.5);border-radius:2px;color:inherit;";
              range.surroundContents(mark);
              mark.scrollIntoView({ behavior: "smooth", block: "center" });
              // Remove highlight after 2s
              setTimeout(() => {
                const parent = mark.parentNode;
                if (parent) {
                  parent.replaceChild(
                    document.createTextNode(mark.textContent),
                    mark,
                  );
                  parent.normalize();
                }
              }, 2000);
              break;
            }
          }
        });
      }
    });
  });
}

if (searchBtn) searchBtn.addEventListener("click", openSearch);

if (searchOverlay) {
  searchOverlay.addEventListener("click", (e) => {
    if (e.target === searchOverlay) closeSearch();
  });
}

if (searchInput) {
  searchInput.addEventListener("input", () => performSearch(searchInput.value));
}

// Ctrl/Cmd + K shortcut
document.addEventListener("keydown", (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key === "k") {
    e.preventDefault();
    if (searchOverlay && searchOverlay.style.display === "flex") {
      closeSearch();
    } else {
      openSearch();
    }
  }
  if (
    e.key === "Escape" &&
    searchOverlay &&
    searchOverlay.style.display === "flex"
  ) {
    closeSearch();
  }
});

export { openSearch, closeSearch, performSearch };
