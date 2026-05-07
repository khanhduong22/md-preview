
import { AppState } from '../core/state.js';
import { saveTabsToStorage, renderTabBar } from '../core/tabs.js';

export function initTagsSetup() {
// ========================================
// 4. TAGS
// ========================================
const tagFilterBtn = document.getElementById("tag-filter-btn");
const tagFilterDropdown = document.getElementById("tag-filter-dropdown");
const tagFilterList = document.getElementById("tag-filter-list");
const tagFilterClear = document.getElementById("tag-filter-clear");
let activeTagFilter = null;

function promptTagTab(tabId) {
  const tab = AppState.tabs.find((t) => t.id === tabId);
  if (!tab) return;
  const currentTags = (tab.tags || []).join(", ");
  const input = prompt("Enter tags (comma-separated):", currentTags);
  if (input === null) return; // cancelled
  tab.tags = input
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  saveTabsToStorage(AppState.tabs);
  renderTabBar(AppState.tabs, AppState.activeTabId);
}

function getAllTags() {
  const tagSet = new Set();
  AppState.tabs.forEach((t) => {
    (t.tags || []).forEach((tag) => tagSet.add(tag));
  });
  return Array.from(tagSet).sort();
}

function renderTagFilter() {
  if (!tagFilterList) return;
  const allTags = getAllTags();
  if (allTags.length === 0) {
    tagFilterList.innerHTML =
      '<div style="padding:8px;color:var(--text-muted);font-size:12px;">No tags yet. Use the tab menu to add tags.</div>';
    return;
  }
  tagFilterList.innerHTML = allTags
    .map(
      (tag) =>
        '<div class="tag-filter-item' +
        (activeTagFilter === tag ? " active" : "") +
        '" data-tag="' +
        tag +
        '">' +
        '<i class="bi bi-tag"></i> ' +
        tag +
        "</div>",
    )
    .join("");

  tagFilterList.querySelectorAll(".tag-filter-item").forEach((item) => {
    item.addEventListener("click", () => {
      activeTagFilter = item.dataset.tag;
      renderTagFilter();
      renderTabBar(AppState.tabs, AppState.activeTabId);
      tagFilterDropdown.style.display = "none";
    });
  });
}

if (tagFilterBtn) {
  tagFilterBtn.addEventListener("click", () => {
    const isOpen = tagFilterDropdown.style.display !== "none";
    tagFilterDropdown.style.display = isOpen ? "none" : "block";
    if (!isOpen) renderTagFilter();
  });
}

if (tagFilterClear) {
  tagFilterClear.addEventListener("click", () => {
    activeTagFilter = null;
    renderTabBar(AppState.tabs, AppState.activeTabId);
    tagFilterDropdown.style.display = "none";
  });
}

// Close tag filter on outside click
document.addEventListener("click", (e) => {
  if (tagFilterDropdown && !e.target.closest("#tag-filter-wrapper")) {
    tagFilterDropdown.style.display = "none";
  }
});
}
