# CLAUDE.md - Developer Guidelines & Command Reference

This file outlines build commands, test instructions, project architecture, and coding standards for AI agents working on this project.

## Development & Build Commands

* **Start Development Server**: `npm run dev`
* **Production Build**: `npm run build`
* **Preview Production Build**: `npm run preview`

## Test & Verification Commands

* **Visual Regression Tests**: `npm run test:visual` (runs Playwright visual tests)
* **Mermaid Verification Script**: `node scripts/temp/verify.js` (launches a browser to verify Mermaid SVG rendering)

## Project Architecture & Structure

This is a vanilla HTML/CSS/JS application using Vite as the bundler.

* **`/index.html`**: Entry point.
* **`/src/main.js`**: Application bootstrap script.
* **`/src/styles.css`**: Core stylesheet containing all design tokens, styling, layouts, and responsive rules.
* **`/src/core/`**: Core editor, state management, and lifecycle logic.
  * `state.js`: Core shared application state (`AppState`).
  * `tabs.js`: Tab creation, switching, context menu, and IndexedDB saving/restoring (via `localforage`).
  * `vault.js`: Local filesystem vault implementation using the Native File System Access API.
  * `autosave.js`: Handles background auto-saving of active tabs and vault files.
  * `editor.js`: Textarea input listeners, keyboard shortcut handling, and change debouncing.
* **`/src/utils/`**: Helper utilities for rendering, exporting, sharing, and markdown parsing (marked.js, dompurify, etc.).

## Coding Guidelines

1. **State Persistence**:
   - `localforage` is used directly for saving/restoring objects (tabs array, active tab ID, groups, history) to enable structured cloning (preserving `FileSystemFileHandle`s in IndexedDB). Do NOT stringify when saving or parse when reading unless handling legacy string data.
2. **Vanilla JavaScript**:
   - Keep files in `src/core/` highly modular.
   - Use standard DOM APIs. Prefer `replaceChildren()` over `.innerHTML = ""` for cleaning nodes, and `insertAdjacentHTML()` for inserting templates.
3. **Vault Mode vs Virtual Tabs**:
   - Tabs can be virtual (no `tab.handle`, stored in memory/IndexedDB) or vault files (`tab.handle` present, stored in the vault directory).
   - In vault mode, preserve unsaved tab states in IndexedDB cache, but load live file content from the filesystem upon startup (if permission is granted) or when vault re-authorization succeeds.
