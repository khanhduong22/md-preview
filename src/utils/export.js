import { markdownEditor } from '../core/dom.js';
import { exportToPdf } from './pdf.js';
import { importMarkdownFile } from './import.js';

export function initExportSetup() {
  const exportMd = document.getElementById("export-md");
  const exportHtml = document.getElementById("export-html");
  const exportPdf = document.getElementById("export-pdf");
  const exportSingleFile = document.getElementById("export-singlefile");
  const copyMarkdownButton = document.getElementById("copy-markdown-button");
  const importButton = document.getElementById("import-button") || document.getElementById("import-md");
  const fileInput = document.getElementById("file-input");

  if (importButton && fileInput) {
    importButton.addEventListener("click", function () {
      fileInput.click();
    });
    fileInput.addEventListener("change", function (e) {
      const file = e.target.files[0];
      if (file) {
        importMarkdownFile(file);
      }
      this.value = "";
    });
  }

  if (exportMd) {
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
  }

  if (exportHtml) {
    exportHtml.addEventListener("click", function () {
      try {
        const markdown = markdownEditor.value;
        const html = marked.parse(markdown);
        const sanitizedHtml = DOMPurify.sanitize(html, {
          ADD_TAGS: ["mjx-container"],
          ADD_ATTR: ["id", "class", "style", "data-mxgraph"],
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
  }

  if (exportPdf) {
    exportPdf.addEventListener("click", async function () {
      const currentTheme = document.documentElement.getAttribute("data-theme");
      await exportToPdf(markdownEditor.value, exportPdf, currentTheme);
    });
  }

  if (exportSingleFile) {
    exportSingleFile.addEventListener("click", async function (e) {
      e.preventDefault();
      try {
        exportSingleFile.textContent = "Building…";
        const htmlSource = await fetch("index.html").then((r) => r.text());
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlSource, "text/html");

        // Try inlining styles.css if available
        try {
          const cssText = await fetch("styles.css").then((r) => (r.ok ? r.text() : ""));
          if (cssText) {
            const style = doc.createElement("style");
            style.textContent = cssText;
            doc.head.appendChild(style);
          }
        } catch (_) {}

        const finalHtml = "<!DOCTYPE html>\n" + doc.documentElement.outerHTML;
        const outBlob = new Blob([finalHtml], {
          type: "text/html;charset=utf-8",
        });
        const url = URL.createObjectURL(outBlob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "md-preview.html";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 10000);
      } catch (err) {
        alert("Failed to build single file: " + err.message);
      } finally {
        exportSingleFile.innerHTML =
          '<i class="bi bi-file-zip me-1"></i>Download Single File (.html)';
      }
    });
  }

  if (copyMarkdownButton) {
    copyMarkdownButton.addEventListener("click", function () {
      try {
        const markdownText = markdownEditor.value;
        copyToClipboard(markdownText);
      } catch (e) {
        console.error("Copy failed:", e);
        alert("Failed to copy Markdown: " + e.message);
      }
    });
  }

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
      alert("Failed to copy Markdown: " + err.message);
    }
  }

  function showCopiedMessage() {
    if (!copyMarkdownButton) return;
    const originalText = copyMarkdownButton.innerHTML;
    copyMarkdownButton.innerHTML = '<i class="bi bi-check-lg"></i> Copied!';
    setTimeout(() => {
      copyMarkdownButton.innerHTML = originalText;
    }, 2000);
  }
}