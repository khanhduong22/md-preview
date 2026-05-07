import { importMarkdownFile } from '../utils/import.js';

const dropzone = document.getElementById("dropzone");
const closeDropzoneBtn = document.getElementById("close-dropzone");
const fileInput = document.getElementById("file-input");

export function initDragDrop() {
  if (!dropzone) return;

  function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  ["dragenter", "dragover"].forEach((eventName) => {
    dropzone.addEventListener(eventName, highlight, false);
  });

  ["dragleave", "drop"].forEach((eventName) => {
    dropzone.addEventListener(eventName, unhighlight, false);
  });

  function highlight() {
    dropzone.classList.add("active");
  }

  function unhighlight() {
    dropzone.classList.remove("active");
  }

  dropzone.addEventListener("drop", handleDrop, false);
  dropzone.addEventListener("click", function (e) {
    if (closeDropzoneBtn && e.target !== closeDropzoneBtn && !closeDropzoneBtn.contains(e.target)) {
      if (fileInput) fileInput.click();
    }
  });
  if (closeDropzoneBtn) {
    closeDropzoneBtn.addEventListener("click", function(e) {
      e.stopPropagation();
      dropzone.style.display = "none";
    });
  }

  function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    if (files.length) {
      const file = files[0];
      const isMarkdownFile =
        file.type === "text/markdown" ||
        file.name.endsWith(".md") ||
        file.name.endsWith(".markdown");
      if (isMarkdownFile) {
        importMarkdownFile(file);
      } else {
        alert("Please upload a Markdown file (.md or .markdown)");
      }
    }
  }
}