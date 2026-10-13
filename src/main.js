import "./styles.css";
import { initTheme } from "./ui/theme.js";
import { initPrivacyNotice } from "./ui/privacy.js";
import { initEditor } from "./core/editor.js";
import { initViewModeUI } from "./utils/viewMode.js";
import { bootstrapApp } from "./core/app.js";
import { initMarkdownParser } from "./core/markdown.js";
import { renderMarkdown } from "./core/render.js";
import { initTour } from "./utils/tour.js";
import { initFocusMode } from "./utils/focusMode.js";
import { initAutoSave } from "./core/autosave.js";
import { sampleMarkdown } from "./utils/sample.js";
import { markdownEditor } from "./core/dom.js";
import { initMermaidZoomModal } from "./utils/mermaidTools.js";
import { initSidebars } from "./ui/sidebar.js";

// Set initial value so it doesn't flash empty
markdownEditor.defaultValue = sampleMarkdown;
markdownEditor.value = sampleMarkdown;

document.addEventListener("DOMContentLoaded", () => {
  initMarkdownParser();
  renderMarkdown();
  initTheme();
  initPrivacyNotice();
  initEditor();
  initViewModeUI();
  bootstrapApp();
  initAutoSave();
  initFocusMode();

  // Defer non-critical UI to next frame to eliminate forced reflows and long tasks on startup
  requestAnimationFrame(() => {
    initTour();
    initMermaidZoomModal();
    initSidebars();
  });
});
