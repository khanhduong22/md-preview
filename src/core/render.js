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
      ADD_ATTR: ["id", "class", "style", "data-mxgraph"],
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
        mermaid.run({
          nodes: Array.from(mermaidNodes),
          suppressErrors: true
        })
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

    // Initialize Draw.io diagrams
    if (window.GraphViewer) {
      try {
        window.GraphViewer.processElements();
      } catch (e) {
        console.warn("Draw.io GraphViewer rendering failed:", e);
      }
    }

    updateDocumentStats();
    updateMobileStats();
    updateTOC();
  } catch (e) {
    console.error("Markdown rendering failed:", e);
    markdownPreview.innerHTML = `<div class="alert alert-danger">
              <strong>Error rendering markdown:</strong> ${e.message}
          </div>
          <pre>${markdownEditor.value}</pre>`;
  }
}

export function updateTOC() {
  const tocTree = document.getElementById('toc-tree');
  if (!tocTree) return;
  
  const headers = markdownPreview.querySelectorAll('h1, h2, h3, h4, h5, h6');
  if (headers.length === 0) {
    tocTree.innerHTML = '<div class="empty-vault-message">No headings found in document.</div>';
    return;
  }
  
  tocTree.innerHTML = '';
  headers.forEach((header, index) => {
    if (!header.id) {
      // Use slugified text as ID or fallback to index
      const slug = header.textContent.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      header.id = slug || 'heading-' + index;
    }
    const level = parseInt(header.tagName.substring(1));
    
    const item = document.createElement('div');
    item.className = 'tree-node';
    item.style.paddingLeft = `${(level - 1) * 16 + 16}px`;
    
    // Styling based on level
    if (level === 1) {
      item.style.fontWeight = '600';
    } else if (level > 2) {
      item.style.opacity = '0.8';
      item.style.fontSize = '0.85rem';
    }
    
    item.innerHTML = `<div class="tree-node-title" title="${header.textContent}">${header.textContent}</div>`;
    
    item.addEventListener('click', () => {
      header.scrollIntoView({ behavior: 'smooth' });
    });
    
    tocTree.appendChild(item);
  });
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
