# Task Breakdown: Add Close All Tabs & Expand/Collapse All Folders

## Task 1: Add HTML markup for new buttons in `index.html`
- [x] Add `#close-all-tabs-btn` in desktop `.tab-bar-actions`
- [x] Add `#mobile-close-all-tabs-btn` in `.mobile-tabs-header`
- [x] Add `#expand-all-folders-btn` and `#collapse-all-folders-btn` in `#sidebar-explorer .vault-actions-container`

## Task 2: Implement tab closure logic in `src/core/tabs.js` and event bindings in `src/core/shortcuts.js` & `src/core/mobile.js`
- [x] Implement `closeAllTabs()` in `src/core/tabs.js`
- [x] Bind `#close-all-tabs-btn` in `src/core/shortcuts.js`
- [x] Bind `#mobile-close-all-tabs-btn` in `src/core/mobile.js`

## Task 3: Implement recursive folder expand/collapse logic in `src/core/vault.js`
- [x] Implement `expandAllFolders()` and `collapseAllFolders()` in `src/core/vault.js`
- [x] Show/hide and bind `#expand-all-folders-btn` and `#collapse-all-folders-btn` in `initVault()` and `renderVaultTree()`

## Task 4: CSS Styling polish in `src/styles.css`
- [x] Ensure button alignment, hover effects, and spacing in tab bar actions and sidebar explorer header

## Task 5: Verification & Testing
- [x] Run build check `npm run build`
- [x] Verify runtime behavior
