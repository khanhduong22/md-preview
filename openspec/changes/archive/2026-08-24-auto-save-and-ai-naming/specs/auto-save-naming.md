# Specification: Auto-Save to Vault & AI-Fallback Smart Naming

## Capability: Auto-Save to Vault Directory
### SPEC-AUTOSAVE-01: Virtual Tab Auto-Flush to Disk
- **GIVEN** a user is in Local Vault mode with an active directory handle (`AppState.vaultDirHandle`)
- **WHEN** the user creates an untitled tab, pastes or writes content, and stops typing for 5 seconds (or 30 seconds interval timer ticks)
- **THEN** the application MUST create a new file in the vault directory
- **AND** the file content MUST match the editor text (never 0 bytes)
- **AND** `AppState.activeTabId` MUST be synchronized to `tab.id` without state corruption
- **AND** the Vault Tree and Tab Bar MUST update immediately.

### SPEC-AUTOSAVE-02: Timestamp and Collision Formatting
- **GIVEN** an untitled file or duplicate file is auto-saved or generated
- **WHEN** computing the filename
- **THEN** the filename MUST include a timestamp formatted as `DDMMYY_HHmm` (e.g. `Bao-cao-tai-chinh_240826_1120.md`)
- **AND** invalid filesystem characters (`\ / : * ? " < > |`) MUST be replaced with `-`.

## Capability: AI & Header-Fallback Auto-Naming
### SPEC-AUTONAME-01: Smart Header Extraction
- **GIVEN** a tab with default title `Untitled X`
- **WHEN** user pastes or types markdown content
- **THEN** the system MUST extract the primary title from:
  1. YAML Frontmatter `title:`
  2. Markdown `# Heading` or `## Heading`
  3. First non-empty meaningful sentence (capped at 36 characters)
- **AND** update the tab title dynamically in the tab bar and state.

### SPEC-AUTONAME-02: Browser AI Enhancement with Graceful Fallback
- **GIVEN** a browser supporting built-in AI (`window.ai.languageModel` or `window.ai.summarizer`)
- **WHEN** auto-naming is triggered
- **THEN** it MAY prompt the local model for a concise 3-5 word summary title
- **AND** if `window.ai` is absent, throws an error, or is slow (>1.5s), it MUST immediately use the Header/Heuristic extracted title without blocking UI.
