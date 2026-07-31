# Change Proposal: Add "Close All Tabs" and "Expand/Collapse All Folders" Buttons

## Context
The user requested two UI enhancements for the `2ndBrain` Markdown Editor:
1. A "Close All Current Tabs" button in the tab bar area to quickly close all open tabs and reset to a single clean tab/workspace.
2. An "Expand All Folders" (and "Collapse All Folders") button in the Explorer sidebar header to expand or collapse all directories in the local Vault folder tree at once.

## Proposed Changes
- **Tab Bar Actions**:
  - Add a `<button id="close-all-tabs-btn">` in `index.html` within `.tab-bar-actions`.
  - Add `closeAllTabs()` function in `src/core/tabs.js` which clears open tabs, handles untitled fallback, updates localforage storage, and re-renders the tab bar.
  - Bind click handler in `src/core/shortcuts.js` (and mobile tab section if applicable).
- **Explorer Sidebar Actions**:
  - Add `<button id="expand-all-folders-btn">` and `<button id="collapse-all-folders-btn">` (or a toggle button) in `index.html` inside `#sidebar-explorer .vault-actions-container`.
  - Add `expandAllFolders()` and `collapseAllFolders()` functions in `src/core/vault.js`.
  - Recursively populate `AppState.expandedVaultPaths` with all directory paths in the current `AppState.vaultDirHandle`, then re-render `renderVaultTree()`.
- **CSS Styling**:
  - Update `src/styles.css` to properly align, style, and highlight the new action buttons.

## Verification
- Run local development server (`npm run dev`) or test scripts to ensure clean building.
- Manually click "Close All Tabs" with multiple open tabs and verify tabs close cleanly.
- Open a multi-folder Vault directory, click "Expand All Folders", verify all subdirectories expand, and click "Collapse All Folders" to verify they collapse.
