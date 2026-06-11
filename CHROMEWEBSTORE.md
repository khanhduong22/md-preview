# Chrome Web Store Listing Metadata

This document is the single source of truth for the `2ndBrain` Chrome Extension store listing, reviews, permissions justifications, and privacy disclosures.

---

## 1. Store Listing Details

### Extension Name
`2ndBrain - Premium Markdown Editor`

### Single-sentence Summary
`A premium, glassmorphism-styled Markdown editor with advanced diagrams, LaTeX math, and local directory sync.`

### Detailed Description
```
2ndBrain is a premium, next-generation Markdown editor designed for professionals, developers, and researchers. Styled with a modern glassmorphism design system, it turns your browser or Chrome Side Panel into a powerful, distraction-free workspace.

Key Features:
- ✍️ Advanced Markdown Editor: Real-time split-screen editing with synchronized scrolling.
- 📊 Extensive Diagram Support: Render over 30 diagram types directly in your document (including Mermaid.js, PlantUML, and Draw.io).
- 📐 Math & LaTeX: Write complex formulas powered by MathJax SVG rendering.
- 📂 Local Directory Sync (Vault): Connect a local folder directly to browser-based editing using the File System Access API.
- 💾 Offline-First Security: All documents, settings, and histories are stored locally on your device via IndexedDB (localforage). Your data never leaves your computer.
- 📥 Premium Exports: Export your markdown files to PDF, HTML, or raw MD.
```

---

## 2. Permissions Justification

Every permission declared in `manifest.json` must be justified here in plain English:

| Permission | Category | Justification |
|------------|----------|---------------|
| `sidePanel` | UI Integration | Required to enable the side panel layout. Allows the user to click the extension icon to view and edit markdown documents side-by-side with other webpages. |

---

## 3. Privacy & Data Use Disclosure

- **Data Collection**: 2ndBrain collects **zero (0)** user data.
- **Data Transmission**: All processing, parsing, rendering, and storage happens entirely on the user's local device. No data is transmitted to external servers.
- **Data Storage**: Notes and settings are stored locally on the client machine using browser `IndexedDB` and `localStorage` (via localforage).

### Privacy Policy Draft
```
Privacy Policy for 2ndBrain Chrome Extension
Last Updated: May 29, 2026

1. Collection of Information:
We do not collect, store, or share any personal information, browsing history, or user-generated content.

2. Storage of Content:
All notes, files, and configuration options created inside the extension are stored locally on your device using IndexedDB and localStorage APIs. We have no access to your data.

3. Third-party Services:
The extension operates completely offline. Diagram rendering (Mermaid, Draw.io) and LaTeX processing are bundled locally. PlantUML diagrams are rendered by sending encoded strings to the official plantuml.com server to generate images (rendered via standard image tags), but no personal or identifying information is sent.
```

---

## 4. Version History

- **v1.0.0 (2026-05-29)**: Initial release. Bundled all CDN scripts locally to meet Manifest V3 security requirements. Configured side panel and full-page editor actions. Added PNG icon generation.
