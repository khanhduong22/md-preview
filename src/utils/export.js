
import { markdownEditor } from '../core/dom.js';
import { PAGE_CONFIG, applyPageBreaksWithCascade, exportToPdf, handleOversizedElements } from './pdf.js';

export function initExportSetup() {
  const exportMd = document.getElementById("export-md");
  const exportHtml = document.getElementById("export-html");
  const exportPdf = document.getElementById("export-pdf");
  
  const copyMarkdownButton = document.getElementById("copy-markdown-button");

  exportMd.addEventListener("click", function () {
  try {
    const blob = new Blob([markdownEditor.value], {
      type: "text/markdown;charset=utf-8",
    });
    saveAs(blob, "document.md");
  } catch (e) {
    console.error("Export failed:", e);
    alert("Export failed: " + e.message);
  }
});

exportHtml.addEventListener("click", function () {
  try {
    const markdown = markdownEditor.value;
    const html = marked.parse(markdown);
    const sanitizedHtml = DOMPurify.sanitize(html, {
      ADD_TAGS: ["mjx-container"],
      ADD_ATTR: ["id", "class", "style"],
    });
    const isDarkTheme =
      document.documentElement.getAttribute("data-theme") === "dark";
    const cssTheme = isDarkTheme
      ? "https://cdnjs.cloudflare.com/ajax/libs/github-markdown-css/5.3.0/github-markdown-dark.min.css"
      : "https://cdnjs.cloudflare.com/ajax/libs/github-markdown-css/5.3.0/github-markdown.min.css";
    const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Markdown Export</title>
  <link rel="stylesheet" href="${cssTheme}">
  <style>
      body {
          background-color: ${isDarkTheme ? "#0d1117" : "#ffffff"};
          color: ${isDarkTheme ? "#c9d1d9" : "#24292e"};
      }
      .markdown-body {
          box-sizing: border-box;
          min-width: 200px;
          max-width: 980px;
          margin: 0 auto;
          padding: 45px;
          background-color: ${isDarkTheme ? "#0d1117" : "#ffffff"};
          color: ${isDarkTheme ? "#c9d1d9" : "#24292e"};
      }

      /* Syntax Highlighting */
      .hljs-doctag, .hljs-keyword, .hljs-template-tag, .hljs-template-variable, .hljs-type, .hljs-variable.language_ { color: ${isDarkTheme ? "#ff7b72" : "#d73a49"}; }
      .hljs-title, .hljs-title.class_, .hljs-title.class_.inherited__, .hljs-title.function_ { color: ${isDarkTheme ? "#d2a8ff" : "#6f42c1"}; }
      .hljs-attr, .hljs-attribute, .hljs-literal, .hljs-meta, .hljs-number, .hljs-operator, .hljs-variable, .hljs-selector-attr, .hljs-selector-class, .hljs-selector-id { color: ${isDarkTheme ? "#79c0ff" : "#005cc5"}; }
      .hljs-regexp, .hljs-string, .hljs-meta .hljs-string { color: ${isDarkTheme ? "#a5d6ff" : "#032f62"}; }
      .hljs-built_in, .hljs-symbol { color: ${isDarkTheme ? "#ffa657" : "#e36209"}; }
      .hljs-comment, .hljs-code, .hljs-formula { color: ${isDarkTheme ? "#8b949e" : "#6a737d"}; }
      .hljs-name, .hljs-quote, .hljs-selector-tag, .hljs-selector-pseudo { color: ${isDarkTheme ? "#7ee787" : "#22863a"}; }
      .hljs-subst { color: ${isDarkTheme ? "#c9d1d9" : "#24292e"}; }
      .hljs-section { color: ${isDarkTheme ? "#1f6feb" : "#005cc5"}; font-weight: bold; }
      .hljs-bullet { color: ${isDarkTheme ? "#79c0ff" : "#005cc5"}; }
      .hljs-emphasis { font-style: italic; }
      .hljs-strong { font-weight: bold; }
      .hljs-addition { color: ${isDarkTheme ? "#aff5b4" : "#22863a"}; background-color: ${isDarkTheme ? "#033a16" : "#f0fff4"}; }
      .hljs-deletion { color: ${isDarkTheme ? "#ffdcd7" : "#b31d28"}; background-color: ${isDarkTheme ? "#67060c" : "#ffeef0"}; }

      @media (max-width: 767px) {
          .markdown-body {
              padding: 15px;
          }
      }
  </style>
</head>
<body>
  <article class="markdown-body">
      ${sanitizedHtml}
  </article>
</body>
</html>`;
    const blob = new Blob([fullHtml], { type: "text/html;charset=utf-8" });
    saveAs(blob, "document.html");
  } catch (e) {
    console.error("HTML export failed:", e);
    alert("HTML export failed: " + e.message);
  }
});

// Single-file app download
const exportSingleFile = document.getElementById("export-singlefile");
if (exportSingleFile) {
  exportSingleFile.addEventListener("click", async function (e) {
    e.preventDefault();
    try {
      exportSingleFile.textContent = "Building…";

      // Fetch all external assets
      const [cssText, jsText] = await Promise.all([
        fetch("styles.css").then((r) => r.text()),
        fetch("script.js").then((r) => r.text()),
      ]);

      // Read current index.html and inline everything
      const htmlSource = await fetch("index.html").then((r) => r.text());
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlSource, "text/html");

      // Replace <link href="styles.css"> with inline <style>
      doc.querySelectorAll('link[href="styles.css"]').forEach((el) => {
        const style = doc.createElement("style");
        style.textContent = cssText;
        el.replaceWith(style);
      });

      // Replace the main script tag with inline <script>
      const scriptTags = Array.from(doc.querySelectorAll("script"));
      const mainScript = scriptTags.find(
        (el) =>
          el.src &&
          (el.src.includes("script.js") || el.src.includes("main.js")),
      );
      if (mainScript) {
        const script = doc.createElement("script");
        script.textContent = jsText;
        mainScript.replaceWith(script);
      }

      const finalHtml = "<!DOCTYPE html>\n" + doc.documentElement.outerHTML;
      const outBlob = new Blob([finalHtml], {
        type: "text/html;charset=utf-8",
      });
      const url = URL.createObjectURL(outBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "md-preview.html";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert("Failed to build single file: " + err.message);
    } finally {
      exportSingleFile.innerHTML =
        '<i class="bi bi-file-zip me-1"></i>Download Single File (.html)';
    }
  });
}

// ============================================
// Page-Break Detection Functions (Story 1.1)
// ============================================

// Page configuration constants for A4 PDF export
exportPdf.addEventListener("click", async function () {
  const currentTheme = document.documentElement.getAttribute("data-theme");
  await exportToPdf(markdownEditor.value, exportPdf, currentTheme);
});

copyMarkdownButton.addEventListener("click", function () {
  try {
    const markdownText = markdownEditor.value;
    copyToClipboard(markdownText);
  } catch (e) {
    console.error("Copy failed:", e);
    alert("Failed to copy Markdown: " + e.message);
  }
});

async function copyToClipboard(text) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      showCopiedMessage();
    } else {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand("copy");
      document.body.removeChild(textArea);
      if (successful) {
        showCopiedMessage();
      } else {
        throw new Error("Copy command was unsuccessful");
      }
    }
  } catch (err) {
    console.error("Copy failed:", err);
    alert("Failed to copy HTML: " + err.message);
  }
}

function showCopiedMessage() {
  const originalText = copyMarkdownButton.innerHTML;
  copyMarkdownButton.innerHTML = '<i class="bi bi-check-lg"></i> Copied!';

  setTimeout(() => {
    copyMarkdownButton.innerHTML = originalText;
  }, 2000);
}
}

export function initExportEvents() {
const importButton = document.getElementById("import-md");
importButton?.addEventListener("click", function () {
    fileInput.click();
  });

  const fileInput = document.getElementById("file-input");
fileInput?.addEventListener("change", function (e) {
    const file = e.target.files[0];
    if (file) {
      importMarkdownFile(file);
    }
    this.value = "";
  });

  const exportMd = document.getElementById("export-md");
exportMd?.addEventListener("click", function () {
    try {
      const blob = new Blob([markdownEditor.value], {
        type: "text/markdown;charset=utf-8",
      });
      saveAs(blob, "document.md");
    } catch (e) {
      console.error("Export failed:", e);
      alert("Export failed: " + e.message);
    }
  });

  const exportHtml = document.getElementById("export-html");
exportHtml?.addEventListener("click", function () {
    try {
      const markdown = markdownEditor.value;
      const html = marked.parse(markdown);
      const sanitizedHtml = DOMPurify.sanitize(html, {
        ADD_TAGS: ['mjx-container'], 
        ADD_ATTR: ['id', 'class', 'style']
      });
      const isDarkTheme =
        document.documentElement.getAttribute("data-theme") === "dark";
      const cssTheme = isDarkTheme
        ? "https://cdnjs.cloudflare.com/ajax/libs/github-markdown-css/5.3.0/github-markdown-dark.min.css"
        : "https://cdnjs.cloudflare.com/ajax/libs/github-markdown-css/5.3.0/github-markdown.min.css";
      const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Markdown Export</title>
  <link rel="stylesheet" href="${cssTheme}">
  <style>
      body {
          background-color: ${isDarkTheme ? "#0d1117" : "#ffffff"};
          color: ${isDarkTheme ? "#c9d1d9" : "#24292e"};
      }
      .markdown-body {
          box-sizing: border-box;
          min-width: 200px;
          max-width: 980px;
          margin: 0 auto;
          padding: 45px;
          background-color: ${isDarkTheme ? "#0d1117" : "#ffffff"};
          color: ${isDarkTheme ? "#c9d1d9" : "#24292e"};
      }

      /* Syntax Highlighting */
      .hljs-doctag, .hljs-keyword, .hljs-template-tag, .hljs-template-variable, .hljs-type, .hljs-variable.language_ { color: ${isDarkTheme ? "#ff7b72" : "#d73a49"}; }
      .hljs-title, .hljs-title.class_, .hljs-title.class_.inherited__, .hljs-title.function_ { color: ${isDarkTheme ? "#d2a8ff" : "#6f42c1"}; }
      .hljs-attr, .hljs-attribute, .hljs-literal, .hljs-meta, .hljs-number, .hljs-operator, .hljs-variable, .hljs-selector-attr, .hljs-selector-class, .hljs-selector-id { color: ${isDarkTheme ? "#79c0ff" : "#005cc5"}; }
      .hljs-regexp, .hljs-string, .hljs-meta .hljs-string { color: ${isDarkTheme ? "#a5d6ff" : "#032f62"}; }
      .hljs-built_in, .hljs-symbol { color: ${isDarkTheme ? "#ffa657" : "#e36209"}; }
      .hljs-comment, .hljs-code, .hljs-formula { color: ${isDarkTheme ? "#8b949e" : "#6a737d"}; }
      .hljs-name, .hljs-quote, .hljs-selector-tag, .hljs-selector-pseudo { color: ${isDarkTheme ? "#7ee787" : "#22863a"}; }
      .hljs-subst { color: ${isDarkTheme ? "#c9d1d9" : "#24292e"}; }
      .hljs-section { color: ${isDarkTheme ? "#1f6feb" : "#005cc5"}; font-weight: bold; }
      .hljs-bullet { color: ${isDarkTheme ? "#79c0ff" : "#005cc5"}; }
      .hljs-emphasis { font-style: italic; }
      .hljs-strong { font-weight: bold; }
      .hljs-addition { color: ${isDarkTheme ? "#aff5b4" : "#22863a"}; background-color: ${isDarkTheme ? "#033a16" : "#f0fff4"}; }
      .hljs-deletion { color: ${isDarkTheme ? "#ffdcd7" : "#b31d28"}; background-color: ${isDarkTheme ? "#67060c" : "#ffeef0"}; }

      @media (max-width: 767px) {
          .markdown-body {
              padding: 15px;
          }
      }
  </style>
</head>
<body>
  <article class="markdown-body">
      ${sanitizedHtml}
  </article>
</body>
</html>`;
      const blob = new Blob([fullHtml], { type: "text/html;charset=utf-8" });
      saveAs(blob, "document.html");
    } catch (e) {
      console.error("HTML export failed:", e);
      alert("HTML export failed: " + e.message);
    }
  });

  // Single-file app download
  const exportSingleFile = document.getElementById('export-singlefile');
  if (exportSingleFile) {
    const exportSingleFile = document.getElementById("export-single-file");
exportSingleFile?.addEventListener('click', async function(e) {
      e.preventDefault();
      try {
        exportSingleFile.textContent = 'Building…';

        // Fetch all external assets
        const [cssText, jsText] = await Promise.all([
          fetch('styles.css').then(r => r.text()),
          fetch('script.js').then(r => r.text())
        ]);

        // Read current index.html and inline everything
        const htmlSource = await fetch('index.html').then(r => r.text());
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlSource, 'text/html');

        // Replace <link href="styles.css"> with inline <style>
        doc.querySelectorAll('link[href="styles.css"]').forEach(el => {
          const style = doc.createElement('style');
          style.textContent = cssText;
          el.replaceWith(style);
        });

        // Replace the main script tag with inline <script>
        const scriptTags = Array.from(doc.querySelectorAll('script'));
        const mainScript = scriptTags.find(el => el.src && (el.src.includes('script.js') || el.src.includes('main.js')));
        if (mainScript) {
          const script = doc.createElement('script');
          script.textContent = jsText;
          mainScript.replaceWith(script);
        }

        const finalHtml = '<!DOCTYPE html>\n' + doc.documentElement.outerHTML;
        const outBlob = new Blob([finalHtml], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(outBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'md-preview.html';
        a.click();
        URL.revokeObjectURL(url);
      } catch (err) {
        alert('Failed to build single file: ' + err.message);
      } finally {
        exportSingleFile.innerHTML = '<i class="bi bi-file-zip me-1"></i>Download Single File (.html)';
      }
    });
  }

  // ============================================
  // Page-Break Detection Functions (Story 1.1)
  // ============================================

  // Page configuration constants for A4 PDF export
  const PAGE_CONFIG = {
    a4Width: 210,           // mm
    a4Height: 297,          // mm
    margin: 15,             // mm each side
    contentWidth: 180,      // 210 - 30 (margins)
    contentHeight: 267,     // 297 - 30 (margins)
    windowWidth: 1000,      // html2canvas config
    scale: 2                // html2canvas scale factor
  };

  /**
   * Task 1: Identifies all graphic elements that may need page-break handling
   * @param {HTMLElement} container - The container element to search within
   * @returns {Array} Array of {element, type} objects
   */
  
// --- Removed Block ---

}