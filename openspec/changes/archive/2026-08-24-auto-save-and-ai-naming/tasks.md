# Tasks: Auto-Save to Vault & AI-Fallback Smart Naming

## Task Breakdown

- [ ] **Task 1: Auto-Naming & Sanitization Utilities**
  - [ ] Implement `src/utils/autoname.js` with `formatDateTimestamp`, `sanitizeFileName`, `extractMarkdownTitle`, and `generateSmartTitle` (supporting `window.ai` with instant header fallback).
  - [ ] Add unit test suite in `tests/autoname.spec.js` covering header parsing, frontmatter extraction, timestamp formatting, and sanitization.

- [ ] **Task 2: Fix Auto-Save Engine and State Synchronization**
  - [ ] Refactor `src/core/autosave.js` to eliminate `AppState.activeTabId` mismatch bug.
  - [ ] Update `autosave.js` to reduce virtual tab delay from 5 minutes to 5s debounce on pause / 30s periodic timer.
  - [ ] Ensure non-empty check (`content.trim().length > 0`) before persisting virtual tabs.
  - [ ] Append timestamp `DDMMYY_HHmm` to auto-saved virtual files.
  - [ ] Synchronize `AppState.activeTabId`, `saveActiveTabId`, `saveTabsToStorage`, `renderTabBar`, and `renderVaultTree`.

- [ ] **Task 3: Editor Integration for Real-Time Auto-Naming**
  - [ ] Update `src/core/editor.js` on input/paste: if tab is `Untitled X`, automatically extract smart title and rename the tab in place.
  - [ ] Trigger debounced vault auto-save (5s) when typing in local vault mode.

- [ ] **Task 4: Playwright E2E Test Suite & Verification**
  - [ ] Add E2E tests in `tests/tabs.spec.js` and `tests/advanced_features.spec.js` verifying:
    - Auto-naming tab from `# Header` on paste.
    - Timestamp generation `DDMMYY_HHmm`.
    - Auto-saving virtual tab into Mock Vault handle without 0-byte corruption.
  - [ ] Run full Playwright test suite (`npx playwright test`).

- [ ] **Task 5: Quad-Skill Review & Hardening**
  - [ ] Code Quality Audit (`code-review-and-quality`).
  - [ ] Code Simplification Audit (`code-simplification`).
  - [ ] Performance Optimization Audit (`performance-optimization`).
  - [ ] Security & Hardening Audit (`security-and-hardening`).

- [ ] **Task 6: OpenSpec Archive & Ship Checklist**
  - [ ] Archive OpenSpec change proposal.
  - [ ] Output mandatory 7-step pre-ship verification table.
