const marked = require('marked');
const DOMPurify = require('isomorphic-dompurify');

const renderer = new marked.Renderer();
renderer.code = function(code, language) {
  if (language === 'mermaid') {
    return `<div class="mermaid">${code}</div>`;
  }
  return `<pre><code>${code}</code></pre>`;
};
marked.setOptions({ renderer: renderer });

let md = `
\`\`\`mermaid
C4Dynamic
    Container(main, "Electron", "Node.js", "Xử lý IPC")
    ContainerExt(api, "TMProxy", "REST", "Hệ thống")
\`\`\`
`;
let html = marked.parse(md);
console.log("MARKDOWN OUTPUT:", html);
let sanitized = DOMPurify.sanitize(html);
console.log("PURIFIED:", sanitized);
