# Change Proposal: Robust Auto-Save to Disk & AI-Fallback Smart Auto-Naming

## Context
When users paste or compose Markdown in an untitled tab while having a Local Vault (directory handle) open in the Explorer sidebar:
1. Virtual tabs failed to flush to disk due to a critical state desync (`AppState.activeTabId` not synced with `tab.id` when creating a file handle), an overly long 5-minute hardcoded timeout, and lack of debounced auto-save on paste.
2. File collision handling used raw epoch timestamps (`Date.now()`), which is hard to read.
3. Users frequently paste documents for review and forget to name tabs, leading to numerous disorganized `Untitled X` tabs.

## Objectives
- **Bug Fix**: Fix the auto-save desync bug in `src/core/autosave.js` and `src/core/tabs.js` so virtual tabs cleanly and immediately save to the open Local Vault upon pasting/typing without data loss or empty 0-byte files.
- **Timestamp Standard**: Adopt user-specified timestamp format `DDMMYY_HHmm` (e.g. `240826_1125`) for auto-saved and duplicate files.
- **Smart Auto-Naming (Hybrid AI + Heuristic)**:
  - Try browser built-in AI (`window.ai` / Chrome Prompt API / Summarizer) to generate concise, descriptive titles.
  - Fallback smoothly to smart Markdown parsing: H1/H2 header (`# Title`), YAML frontmatter (`title:`), or first meaningful sentence (sanitized and capped).
  - Automatically update tab title and file name when pasting/typing into default `Untitled` tabs.

## Verification
- Unit & E2E tests via Playwright (`npx playwright test`).
- Test auto-naming heuristic & AI fallback with diverse Markdown samples (headings, frontmatter, raw text, Vietnamese unicode).
- Test auto-save to mock vault directory and verify content persistence and tab sync.
