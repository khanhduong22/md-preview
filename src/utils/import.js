import { newTab } from '../core/tabs.js';

export function importMarkdownFile(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      newTab(e.target.result, file.name.replace(/\.md$/i, ''));
      const dropzone = document.getElementById("dropzone");
      if (dropzone) dropzone.style.display = "none";
    };
    reader.readAsText(file);
  }