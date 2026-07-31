# Feature Specification: Tab and Folder Navigation Controls

## Requirement 1: Close All Current Tabs
- **ID**: SPEC-TAB-01
- **Description**: The editor tab bar MUST provide a button labeled "Close All" (with icon `bi-x-circle` or `bi-x-lg`) allowing users to close all open tabs with one click.
- **Behavior**:
  - Clicking "Close All" removes all current tabs.
  - In normal mode, it creates a new clean untitled tab.
  - In local vault mode, it closes all open file tabs.
  - Storage is updated in `localforage` and `renderTabBar()` is executed.

## Requirement 2: Expand and Collapse All Folders in Explorer
- **ID**: SPEC-EXP-01
- **Description**: The Vault Explorer sidebar header MUST provide buttons to "Expand All Folders" (`bi-arrows-expand`) and "Collapse All Folders" (`bi-arrows-collapse`).
- **Behavior**:
  - Clicking "Expand All" recursively traverses the root vault directory handle (`AppState.vaultDirHandle`), adds all folder paths to `AppState.expandedVaultPaths`, and triggers `renderVaultTree()`.
  - Clicking "Collapse All" clears `AppState.expandedVaultPaths` and triggers `renderVaultTree()`.
  - Buttons are displayed in `#sidebar-explorer .vault-actions-container` when local vault mode is active.
