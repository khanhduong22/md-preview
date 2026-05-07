import "./styles.css";
import { initTheme } from "./ui/theme.js";
import { initPrivacyNotice } from "./ui/privacy.js";
import { initEditor } from "./core/editor.js";
import { initViewModeUI } from "./utils/viewMode.js";
import { bootstrapApp } from "./core/app.js";
import { initMarkdownParser } from "./core/markdown.js";
import { initTour } from "./utils/tour.js";
import { initAutoSave } from "./core/autosave.js";
import { sampleMarkdown } from "./utils/sample.js";
import { markdownEditor } from "./core/dom.js";

// Set initial value so it doesn't flash empty
markdownEditor.value = sampleMarkdown;

document.addEventListener("DOMContentLoaded", () => {
  initMarkdownParser();
  initTheme();
  initPrivacyNotice();
  initEditor();
  initViewModeUI();
  bootstrapApp();
  initAutoSave();
  initTour();
});
