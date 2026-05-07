import { updateMobileStats } from "./mobile.js";
import {
  markdownEditor,
  previewPane,
  charCountElement,
  wordCountElement,
  readingTimeElement,
} from './dom.js';
import { processEmojis } from "../utils/emoji.js";
import {
  initMermaidZoomModal,
  addMermaidToolbars,
} from "../utils/mermaidTools.js";
import { initMermaid } from "./markdown.js";

const markdownPreview = document.getElementById('markdown-preview');
let markdownRenderTimeout = null;
const RENDER_DELAY = 150;

export function renderMarkdown() {
  try {
    const markdown = markdownEditor.value;
    const html = marked.parse(markdown);
    const sanitizedHtml = DOMPurify.sanitize(html, {
      ADD_TAGS: ["mjx-container"],
      ADD_ATTR: ["id", "class", "style"],
    });
    markdownPreview.innerHTML = sanitizedHtml;

    processEmojis(markdownPreview);

    // Reinitialize mermaid with current theme before rendering diagrams
    initMermaid();

    try {
      const mermaidNodes = markdownPreview.querySelectorAll(".mermaid");
      if (mermaidNodes.length > 0) {
        mermaidNodes.forEach((node) => {
          if (node.innerHTML.includes("\\n")) {
            node.innerHTML = node.innerHTML.replace(/\\n/g, "<br/>");
          }
        });
        Promise.resolve(mermaid.init(undefined, mermaidNodes))
          .then(() => addMermaidToolbars())
          .catch((e) => {
            console.warn("Mermaid rendering failed:", e);
            addMermaidToolbars();
          });
      }
    } catch (e) {
      console.warn("Mermaid rendering failed:", e);
    }

    if (window.MathJax) {
      try {
        MathJax.typesetPromise([markdownPreview]).catch((err) => {
          console.warn("MathJax typesetting failed:", err);
        });
      } catch (e) {
        console.warn("MathJax rendering failed:", e);
      }
    }

    updateDocumentStats();
    updateMobileStats();
  } catch (e) {
    console.error("Markdown rendering failed:", e);
    markdownPreview.innerHTML = `<div class="alert alert-danger">
              <strong>Error rendering markdown:</strong> ${e.message}
          </div>
          <pre>${markdownEditor.value}</pre>`;
  }
}

export function debouncedRender() {
  clearTimeout(markdownRenderTimeout);
  markdownRenderTimeout = setTimeout(renderMarkdown, RENDER_DELAY);
}

export function updateDocumentStats() {
  const text = markdownEditor.value;

  const charCount = text.length;
  if (charCountElement) charCountElement.textContent = charCount.toLocaleString();

  const wordCount = text.trim() === "" ? 0 : text.trim().split(/\s+/).length;
  if (wordCountElement) wordCountElement.textContent = wordCount.toLocaleString();

  const readingTimeMinutes = Math.ceil(wordCount / 200);
  if (readingTimeElement) readingTimeElement.textContent = readingTimeMinutes;
}
