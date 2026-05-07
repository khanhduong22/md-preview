import { markdownEditor } from '../core/dom.js';
export function importMarkdownFile(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      newTab(e.target.result, file.name.replace(/\.md$/i, ''));
      dropzone.style.display = "none";
    };
    reader.readAsText(file);
  }

  