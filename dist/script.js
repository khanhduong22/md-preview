var e=Object.defineProperty,t=(t,n)=>{let r={};for(var i in t)e(r,i,{get:t[i],enumerable:!0});return n||e(r,Symbol.toStringTag,{value:`Module`}),r};(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),e.crossOrigin===`use-credentials`?t.credentials=`include`:e.crossOrigin===`anonymous`?t.credentials=`omit`:t.credentials=`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var n=document.getElementById(`markdown-editor`),r=document.getElementById(`theme-toggle`),i=document.getElementById(`toggle-sync`),a=document.getElementById(`markdown-editor`),o=document.querySelector(`.preview-pane`),s=document.getElementById(`reading-time`),c=document.getElementById(`word-count`),l=document.getElementById(`char-count`),u=document.getElementById(`toc-toggle-btn`),d=document.getElementById(`sidebar-toc`),f=document.getElementById(`explorer-toggle-btn`),p=document.getElementById(`sidebar-explorer`),m=`markdownViewerTabs`,h=`markdownViewerActiveTab`,g=`markdownViewerUntitledCounter`,ee=`kido-vault-handle`,_=`markdownViewerGroups`,v=`kido-md-history`,y={tabs:[],activeTabId:null,tabGroups:[],localVaultMode:!1,vaultDirHandle:null,vaultEntries:[],expandedVaultPaths:new Set,vaultMiniSearch:null},te=`modulepreload`,b=function(e){return`/`+e},ne={},re=function(e,t,n){let r=Promise.resolve();if(t&&t.length>0){let e=document.getElementsByTagName(`link`),i=document.querySelector(`meta[property=csp-nonce]`),a=i?.nonce||i?.getAttribute(`nonce`);function o(e){return Promise.all(e.map(e=>Promise.resolve(e).then(e=>({status:`fulfilled`,value:e}),e=>({status:`rejected`,reason:e}))))}r=o(t.map(t=>{if(t=b(t,n),t in ne)return;ne[t]=!0;let r=t.endsWith(`.css`),i=r?`[rel="stylesheet"]`:``;if(n)for(let n=e.length-1;n>=0;n--){let i=e[n];if(i.href===t&&(!r||i.rel===`stylesheet`))return}else if(document.querySelector(`link[href="${t}"]${i}`))return;let o=document.createElement(`link`);if(o.rel=r?`stylesheet`:te,r||(o.as=`script`),o.crossOrigin=``,o.href=t,a&&o.setAttribute(`nonce`,a),document.head.appendChild(o),r)return new Promise((e,n)=>{o.addEventListener(`load`,e),o.addEventListener(`error`,()=>n(Error(`Unable to preload CSS for ${t}`)))})}))}function i(e){let t=new Event(`vite:preloadError`,{cancelable:!0});if(t.payload=e,window.dispatchEvent(t),!t.defaultPrevented)throw e}return r.then(t=>{for(let e of t||[])e.status===`rejected`&&i(e.reason);return e().catch(i)})};async function ie(e,t,n){try{if(e.handle.kind===`directory`){let n=await e.parentDir.getDirectoryHandle(t,{create:!0});async function r(e,t){for await(let[n,i]of e.entries())if(i.kind===`file`){let e=await i.getFile(),r=await(await t.getFileHandle(n,{create:!0})).createWritable();await r.write(await e.arrayBuffer()),await r.close()}else i.kind===`directory`&&await r(i,await t.getDirectoryHandle(n,{create:!0}))}await r(e.handle,n),await e.parentDir.removeEntry(e.name,{recursive:!0});let i=y.tabGroups.find(t=>t.name===e.name);i&&(i.name=t,R(y.tabs,y.activeTabId),typeof saveTabGroups==`function`&&saveTabGroups())}else{t.endsWith(`.md`)||(t+=`.md`);let n=await(await e.handle.getFile()).text(),r=await e.parentDir.getFileHandle(t,{create:!0}),i=await r.createWritable();await i.write(n),await i.close(),await e.parentDir.removeEntry(e.name),y.activeTabId===e.path&&(y.activeTabId=e.path.substring(0,e.path.lastIndexOf(`/`))+`/`+t);let a=y.tabs.find(t=>t.id===e.path);a&&(a.id=e.path.substring(0,e.path.lastIndexOf(`/`))+`/`+t,a.title=t,a.handle=r)}await x()}catch(e){alert(`Rename failed: `+e.message),n&&n()}}function ae(e,t,n){let r=document.createElement(`input`);r.type=`text`,r.value=t,r.className=`inline-rename-input`;let i=!1,a=e=>{i||(i=!0,n(e))};r.onblur=()=>a(r.value.trim()),r.onkeydown=e=>{e.key===`Enter`&&a(r.value.trim()),e.key===`Escape`&&a(t)},e.replaceWith(r),r.focus(),r.select()}async function oe(){try{y.vaultDirHandle=await window.showDirectoryPicker({mode:`readwrite`}),await localforage.setItem(ee,y.vaultDirHandle);let e=y.tabs.filter(e=>!e.handle);e.length>0&&await localforage.setItem(`md-preview-tabs`,JSON.stringify(e)),await se(y.vaultDirHandle,!1)}catch(e){console.error(`Vault open failed:`,e)}}async function se(e,t=!1){if(!e)return;if(y.vaultDirHandle=e,y.localVaultMode=!0,document.querySelector(`.empty-vault-message`).style.display=`none`,await y.vaultDirHandle.queryPermission({mode:`readwrite`})!==`granted`){let e=document.createElement(`button`);e.className=`tool-button`,e.style.margin=`10px`,e.innerText=`Re-authorize Vault Access`,e.onclick=async()=>{if(await y.vaultDirHandle.requestPermission({mode:`readwrite`})===`granted`){await x();let e=y.tabs.find(e=>e.id===y.activeTabId);if(e&&e.handle)try{e.content=await(await e.handle.getFile()).text(),n.value=e.content||``;let{renderMarkdown:t}=await re(async()=>{let{renderMarkdown:e}=await Promise.resolve().then(()=>gt);return{renderMarkdown:e}},void 0);t()}catch(e){console.warn(`Failed to reload active tab after re-authorization`,e)}}};let t=document.getElementById(`file-tree`);t.innerHTML=``,t.appendChild(e);return}t||(y.tabs=[],y.activeTabId=null,n.value=``,R(y.tabs,y.activeTabId)),document.getElementById(`root-new-folder-btn`).style.display=`inline-flex`,document.getElementById(`root-new-file-btn`).style.display=`inline-flex`,document.querySelector(`.vault-action-divider`)&&(document.querySelector(`.vault-action-divider`).style.display=`block`);let r=async()=>{try{let e=prompt(`New Markdown File Name at Root:`);e&&(e.endsWith(`.md`)||(e+=`.md`),await y.vaultDirHandle.getFileHandle(e,{create:!0}),await x())}catch(e){alert(`Error: `+e.message)}},i=async()=>{try{let e=prompt(`New Folder Name at Root:`);e&&(await y.vaultDirHandle.getDirectoryHandle(e,{create:!0}),await x())}catch(e){alert(`Error: `+e.message)}},a=document.getElementById(`root-new-file-btn`),o=document.getElementById(`root-new-folder-btn`);a.replaceWith(a.cloneNode(!0)),o.replaceWith(o.cloneNode(!0)),document.getElementById(`root-new-file-btn`).addEventListener(`click`,r),document.getElementById(`root-new-folder-btn`).addEventListener(`click`,i),await x()}async function ce(e){let t=y.tabs.find(t=>t.id===e.path);if(!t){t=L(``,e.name),t.id=e.path,t.handle=e.handle;let n=e.path.split(`/`).filter(Boolean);if(n.length>1){let e=n[n.length-2],r=y.tabGroups.find(t=>t.name===e);r||=Be(e,GROUP_COLORS[Math.floor(Math.random()*GROUP_COLORS.length)].name),t.groupId=r.id}y.tabs.push(t)}await B(t.id)}async function x(){let e=document.getElementById(`file-tree`);e.innerHTML=``,window.MiniSearch&&(y.vaultMiniSearch=new window.MiniSearch({fields:[`title`,`content`],storeFields:[`title`,`content`,`path`]}));let t=async(e,n,r)=>{let i=[];for await(let[t,r]of e.entries())t.startsWith(`.`)||i.push({name:t,handle:r,path:n+`/`+t,parentDir:e});i.sort((e,t)=>e.handle.kind===t.handle.kind?e.name.localeCompare(t.name):e.handle.kind===`directory`?-1:1);for(let e of i){let n=document.createElement(`div`);n.className=`tree-node`+(e.handle.kind===`directory`?` is-dir`:``);let i=`<i class="bi bi-${e.handle.kind===`directory`?`folder`:`file-text`}"></i>`,a=`<span class="tree-node-title" title="${e.name}">${e.name}</span>`,o=`<div class="tree-node-actions">`;e.handle.kind===`directory`&&(o+=`<button class="tree-node-action-btn" title="New File" data-action="new-file"><i class="bi bi-file-earmark-plus"></i></button>`,o+=`<button class="tree-node-action-btn" title="New Folder" data-action="new-folder"><i class="bi bi-folder-plus"></i></button>`),o+=`<button class="tree-node-action-btn" title="Rename" data-action="rename"><i class="bi bi-pencil"></i></button>`,o+=`<button class="tree-node-action-btn" title="Delete" data-action="delete"><i class="bi bi-trash"></i></button>`,o+=`</div>`,n.innerHTML=i+a+o,r.appendChild(n);let s=null;e.handle.kind===`directory`&&(s=document.createElement(`div`),s.className=`tree-children`,s.style.paddingLeft=`16px`,r.appendChild(s),y.expandedVaultPaths.has(e.path)&&(s.classList.add(`expanded`),n.querySelector(`i`).className=`bi bi-folder2-open`),await t(e.handle,e.path,s)),n.onclick=async t=>{let r=t.target.closest(`.tree-node-action-btn`);if(r){t.stopPropagation();let i=r.dataset.action;try{if(i===`new-file`){let t=prompt(`New Markdown File Name:`);t&&(t.endsWith(`.md`)||(t+=`.md`),await e.handle.getFileHandle(t,{create:!0}),y.expandedVaultPaths.add(e.path),await x())}else if(i===`new-folder`){let t=prompt(`New Folder Name:`);t&&(await e.handle.getDirectoryHandle(t,{create:!0}),y.expandedVaultPaths.add(e.path),await x())}else if(i===`delete`){if(confirm(`Are you sure you want to delete "`+e.name+`"?`)){await e.parentDir.removeEntry(e.name,{recursive:!0});let t=y.tabs.find(t=>t.id===e.path);t&&Xe(t.id),await x()}}else if(i===`rename`){let t=n.querySelector(`.tree-node-title`);ae(t,e.name,async n=>{n&&n!==e.name?(r.innerHTML,r.innerHTML=`<i class="bi bi-hourglass-split"></i>`,await ie(e,n,()=>{t.replaceWith(t.cloneNode(!0))})):await x()})}}catch(e){alert(`Action failed: `+e.message)}return}t.stopPropagation(),e.handle.kind===`directory`?(s.classList.toggle(`expanded`),s.classList.contains(`expanded`)?y.expandedVaultPaths.add(e.path):y.expandedVaultPaths.delete(e.path),n.querySelector(`i`).className=`bi bi-${s.classList.contains(`expanded`)?`folder2-open`:`folder`}`):e.name.endsWith(`.md`)&&(await ce(e),document.querySelectorAll(`.tree-node`).forEach(e=>e.classList.remove(`active`)),n.classList.add(`active`))};let c=n.querySelector(`.tree-node-title`);c.ondblclick=t=>{t.stopPropagation(),ae(c,e.name,async t=>{t&&t!==e.name?await ie(e,t):await x()})},e.handle.kind===`file`&&e.name.endsWith(`.md`)&&e.handle.getFile().then(e=>e.text()).then(t=>{y.vaultMiniSearch&&y.vaultMiniSearch.add({id:e.path,title:e.name,path:e.path,content:t})})}};await t(y.vaultDirHandle,``,e),await le()}async function le(){let e=document.getElementById(`sync-vault-btn`);if(e)if(y.localVaultMode&&y.vaultDirHandle)try{let t=await localforage.getItem(`md-preview-tabs`),n=t?JSON.parse(t):[];n&&n.length>0?(e.style.display=`inline-flex`,e.onclick=async()=>{if(confirm(`Import `+n.length+` virtual notes into your Vault?`))try{for(let e of n){let t=(e.title||`Untitled`).replace(/[\\/:*?"<>|]/g,`-`),n=t+`.md`,r;try{r=await y.vaultDirHandle.getFileHandle(n,{create:!1}),n=t+`_`+Date.now()+`.md`,r=await y.vaultDirHandle.getFileHandle(n,{create:!0})}catch{r=await y.vaultDirHandle.getFileHandle(n,{create:!0})}let i=await r.createWritable();await i.write(e.content||``),await i.close()}alert(`Import successful! Virtual notes are now in your vault.`),await localforage.removeItem(`md-preview-tabs`),e.style.display=`none`,await x()}catch(e){alert(`Error importing notes: `+e.message)}}):e.style.display=`none`}catch{e.style.display=`none`}else e.style.display=`none`}function ue(){let e=document.getElementById(`open-vault-btn`);e&&e.addEventListener(`click`,oe)}document.readyState===`loading`?document.addEventListener(`DOMContentLoaded`,ue):ue();var de=document.getElementById(`mobile-toggle-sync`),S=document.querySelector(`.content-container`),fe=document.querySelectorAll(`.view-mode-btn:not(.focus-mode-toggle-btn)`),pe=document.querySelectorAll(`.mobile-view-mode-btn`),C=document.querySelector(`.resize-divider`),me=document.querySelector(`.editor-pane`),he=document.querySelector(`.preview-pane`),w=!0,ge=!1,_e=!1,ve=null,ye=10,T=`split`,E=!1,D=!1,be=50,O=20;function xe(){!w||_e||(ge=!0,clearTimeout(ve),ve=setTimeout(()=>{let e=a.scrollTop/(a.scrollHeight-a.clientHeight),t=(o.scrollHeight-o.clientHeight)*e;!isNaN(t)&&isFinite(t)&&(o.scrollTop=t),setTimeout(()=>{ge=!1},50)},ye))}function Se(){!w||ge||(_e=!0,clearTimeout(ve),ve=setTimeout(()=>{let e=o.scrollTop/(o.scrollHeight-o.clientHeight),t=(a.scrollHeight-a.clientHeight)*e;!isNaN(t)&&isFinite(t)&&(a.scrollTop=t),setTimeout(()=>{_e=!1},50)},ye))}function Ce(){w=!w,w?(i.innerHTML=`<i class="bi bi-link"></i> <span class="btn-label">On</span>`,i.classList.add(`sync-enabled`),i.classList.remove(`sync-disabled`,`border-primary`)):(i.innerHTML=`<i class="bi bi-link-45deg"></i> <span class="btn-label">Off</span>`,i.classList.add(`sync-disabled`,`border-primary`),i.classList.remove(`sync-enabled`))}function k(e){if(!e||![`editor`,`split`,`preview`].includes(e))return;if(e===`split`&&T===`split`){E=!E,S.classList.remove(`view-editor-only`,`view-preview-only`,`view-split`,`view-split-reversed`),S.classList.add(E?`view-split-reversed`:`view-split`),je();return}if(e===T)return;let t=T;T=e,S.classList.remove(`view-editor-only`,`view-preview-only`,`view-split`,`view-split-reversed`),S.classList.add(e===`editor`?`view-editor-only`:e===`preview`?`view-preview-only`:E?`view-split-reversed`:`view-split`),fe.forEach(t=>{t.getAttribute(`data-mode`)===e?(t.classList.add(`active`),t.setAttribute(`aria-pressed`,`true`)):(t.classList.remove(`active`),t.setAttribute(`aria-pressed`,`false`))}),pe.forEach(t=>{t.getAttribute(`data-mode`)===e?(t.classList.add(`active`),t.setAttribute(`aria-pressed`,`true`)):(t.classList.remove(`active`),t.setAttribute(`aria-pressed`,`false`))}),we(e),e===`split`?je():t===`split`&&Me(),(e===`split`||e===`preview`)&&W()}function A(e){T=null,k(e||`split`)}function we(e){let t=e===`split`;i&&(i.style.display=t?``:`none`,i.setAttribute(`aria-hidden`,!t)),de&&(de.style.display=t?``:`none`,de.setAttribute(`aria-hidden`,!t))}function Te(){C&&(C.addEventListener(`mousedown`,Ee),document.addEventListener(`mousemove`,Oe),document.addEventListener(`mouseup`,Ae),C.addEventListener(`touchstart`,De),document.addEventListener(`touchmove`,ke),document.addEventListener(`touchend`,Ae))}function Ee(e){T===`split`&&(e.preventDefault(),D=!0,C.classList.add(`dragging`),document.body.classList.add(`resizing`))}function De(e){T===`split`&&(e.preventDefault(),D=!0,C.classList.add(`dragging`),document.body.classList.add(`resizing`))}function Oe(e){if(!D)return;let t=S.getBoundingClientRect(),n=t.width,r=(e.clientX-t.left)/n*100;r=Math.max(O,Math.min(100-O,r)),be=E?100-r:r,je()}function ke(e){if(!D||!e.touches[0])return;let t=S.getBoundingClientRect(),n=t.width,r=(e.touches[0].clientX-t.left)/n*100;r=Math.max(O,Math.min(100-O,r)),be=E?100-r:r,je()}function Ae(){D&&(D=!1,C.classList.remove(`dragging`),document.body.classList.remove(`resizing`))}function je(){if(T!==`split`)return;let e=100-be;me.style.flex=`0 0 calc(${be}% - 4px)`,he.style.flex=`0 0 calc(${e}% - 4px)`}function Me(){me.style.flex=``,he.style.flex=``}function Ne(){document.querySelectorAll(`.view-mode-btn:not(.focus-mode-toggle-btn)`).forEach(e=>{e.addEventListener(`click`,function(){k(this.getAttribute(`data-mode`)),z()})}),a&&a.addEventListener(`scroll`,xe),o&&o.addEventListener(`scroll`,Se),i&&i.addEventListener(`click`,Ce),Te()}var j=`# Welcome to Markdown Viewer

## ✨ Key Features
- **Live Preview** with GitHub styling
- **Smart Import/Export** (MD, HTML, PDF)
- **Mermaid Diagrams** for visual documentation
- **LaTeX Math Support** for scientific notation
- **Emoji Support** 😄 👍 🎉

## 💻 Code with Syntax Highlighting
\`\`\`javascript
  function renderMarkdown() {
    const markdown = markdownEditor.value;
    const html = marked.parse(markdown);
    const sanitizedHtml = DOMPurify.sanitize(html);
    markdownPreview.innerHTML = sanitizedHtml;
    
    // Syntax highlighting is handled automatically
    // during the parsing phase by the marked renderer.
    // Themes are applied instantly via CSS variables.
  }
\`\`\`

## 🧮 Mathematical Expressions
Write complex formulas with LaTeX syntax:

Inline equation: $$E = mc^2$$

Display equations:
$$\\frac{\\partial f}{\\partial x} = \\lim_{h \\to 0} \\frac{f(x+h) - f(x)}{h}$$

$$\\sum_{i=1}^{n} i^2 = \\frac{n(n+1)(2n+1)}{6}$$

## 📊 Mermaid Diagrams
Create powerful visualizations directly in markdown:

\`\`\`mermaid
flowchart LR
    A[Start] --> B{Is it working?}
    B -->|Yes| C[Great!]
    B -->|No| D[Debug]
    C --> E[Deploy]
    D --> B
\`\`\`

### Sequence Diagram Example
\`\`\`mermaid
sequenceDiagram
    User->>Editor: Type markdown
    Editor->>Preview: Render content
    User->>Editor: Make changes
    Editor->>Preview: Update rendering
    User->>Export: Save as PDF
\`\`\`

## 📋 Task Management
- [x] Create responsive layout
- [x] Implement live preview with GitHub styling
- [x] Add syntax highlighting for code blocks
- [x] Support math expressions with LaTeX
- [x] Enable mermaid diagrams

## 🆚 Feature Comparison

| Feature                  | Markdown Viewer (Ours) | Other Markdown Editors  |
|:-------------------------|:----------------------:|:-----------------------:|
| Live Preview             | ✅ GitHub-Styled       | ✅                     |
| Sync Scrolling           | ✅ Two-way             | 🔄 Partial/None        |
| Mermaid Support          | ✅                     | ❌/Limited             |
| LaTeX Math Rendering     | ✅                     | ❌/Limited             |

### 📝 Multi-row Headers Support

<table>
  <thead>
    <tr>
      <th rowspan="2">Document Type</th>
      <th colspan="2">Support</th>
    </tr>
    <tr>
      <th>Markdown Viewer (Ours)</th>
      <th>Other Markdown Editors</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Technical Docs</td>
      <td>Full + Diagrams</td>
      <td>Limited/Basic</td>
    </tr>
    <tr>
      <td>Research Notes</td>
      <td>Full + Math</td>
      <td>Partial</td>
    </tr>
    <tr>
      <td>Developer Guides</td>
      <td>Full + Export Options</td>
      <td>Basic</td>
    </tr>
  </tbody>
</table>

## 📝 Text Formatting Examples

### Text Formatting

Text can be formatted in various ways for ~~strikethrough~~, **bold**, *italic*, or ***bold italic***.

For highlighting important information, use <mark>highlighted text</mark> or add <u>underlines</u> where appropriate.

### Superscript and Subscript

Chemical formulas: H<sub>2</sub>O, CO<sub>2</sub>  
Mathematical notation: x<sup>2</sup>, e<sup>iπ</sup>

### Keyboard Keys

Press <kbd>Ctrl</kbd> + <kbd>B</kbd> for bold text.

### Abbreviations

<abbr title="Graphical User Interface">GUI</abbr>  
<abbr title="Application Programming Interface">API</abbr>

### Text Alignment

<div style="text-align: center">
Centered text for headings or important notices
</div>

<div style="text-align: right">
Right-aligned text (for dates, signatures, etc.)
</div>

### **Lists**

Create bullet points:
* Item 1
* Item 2
  * Nested item
    * Nested further

### **Links and Images**

Add a [link](https://github.com/ThisIs-Developer/Markdown-Viewer) to important resources.

Embed an image:
![Markdown Logo](https://markdownviewer.pages.dev/assets/icon.jpg)

### **Blockquotes**

Quote someone famous:
> "The best way to predict the future is to invent it." - Alan Kay

---

## 🛡️ Security Note

This is a fully client-side application. Your content never leaves your browser and stays secure on your device.`,M=`# Project Master Overview: App Master

Tài liệu này là "Single Source of Truth" (Nguồn chân lý duy nhất) tổng hợp toàn bộ kiến trúc, luồng hoạt động và thiết kế cơ sở dữ liệu của dự án.
Dùng file này làm **Template Chuẩn** cho các dự án sau: mọi người mới vào chỉ cần đọc 1 file duy nhất là hiểu từ Use Case, Cấu trúc hệ thống đến Flow chạy thực tế.

---

## 1. Biểu đồ Use Case (Tính năng người dùng)

Mô tả những hành động mà User có thể thực hiện trên hệ thống. Trả lời câu hỏi: _"Người dùng làm được gì với App này?"_

\`\`\`mermaid
flowchart LR
    User((🧑‍💻 Người dùng))

    subgraph System ["Các tính năng chính (App Master)"]
        direction TB
        UC1(["Tạo & Quản lý Profile (User-Agent, Options)"])
        UC2(["Cấu hình Service & API Đổi IP"])
        UC3(["Cấu hình kịch bản (Keyword, Domain)"])
        UC4(["Mở / Đóng Browser thủ công"])
        UC5(["Chạy tiến trình Automation (Task Worker)"])
        UC6(["Theo dõi trạng thái & Số lần chạy"])
    end

    User --> UC1
    User --> UC2
    User --> UC3
    User --> UC4
    User --> UC5
    User --> UC6
\`\`\`

---

## 2. Sơ đồ Kiến trúc Hệ thống (System Architecture)

Thể hiện cách tổ chức mã nguồn, chia tầng ứng dụng (Frontend, Backend, Browser Engine) và sự tương tác với các hệ thống bên ngoài. Trả lời câu hỏi: _"Code nằm ở đâu và giao tiếp thế nào?"_

\`\`\`mermaid
flowchart TB
    classDef frontend fill:#3b82f6,stroke:#1e40af,stroke-width:2px,color:#fff
    classDef backend fill:#10b981,stroke:#047857,stroke-width:2px,color:#fff
    classDef engine fill:#8b5cf6,stroke:#5b21b6,stroke-width:2px,color:#fff
    classDef db fill:#f59e0b,stroke:#b45309,stroke-width:2px,color:#fff
    classDef external fill:#64748b,stroke:#334155,stroke-width:2px,color:#fff

    User(("Người dùng"))

    subgraph App ["📦 Electron Desktop App"]
        direction TB

        UI["🖥️ React Frontend (Vite) - Quản lý UI/UX, State Zustand"]:::frontend
        Main["⚙️ Electron Main Process - Node.js, Quản lý tiến trình, IPC"]:::backend
        DB[("🗄️ SQLite Database - Prisma ORM")]:::db
        Engine["🚀 Browser Engine - Engine + Stealth Plugin"]:::engine

        UI <-->|IPC Bridge| Main
        Main <-->|Read Write| DB
        Main -->|Dieu khien| Engine
    end

    subgraph Externals ["🌐 Môi trường Internet"]
        Service["🛡️ Cloud Providers - HTTP/Auth hoặc API VN"]:::external
        Google["🔍 Google Search - Security, Auth"]:::external
        Target["🎯 Target Website - Bypass GA4 / Tăng Traffic"]:::external
    end

    User -->|Thao tac| UI
    Engine -->|Dinh tuyen| Service
    Service -->|Mo phong| Google
    Service -->|Click Luot| Target
\`\`\`

---

## 3. Sơ đồ Cấu trúc Dữ liệu (Database ERD)

Dự án hiện tại sử dụng SQLite thông qua Prisma. Trả lời câu hỏi: _"Dữ liệu được lưu trữ ra sao?"_

\`\`\`mermaid
erDiagram
    PROFILE {
        String id PK "UUID"
        String name "Tên gọi/Ghi chú profile"
        String userAgent "Browser Fingerprint chính"
        String Service "HTTP Service hoặc API lấy IP (Tuỳ chọn)"
        String changeIpUrl "Link API để xoay IP (Tuỳ chọn)"
        String keyword "Từ khoá cần Search SEO"
        String domain "Domain đích cần click"
        Int runCount "Thống kê số lần Auto thành công"
        Boolean showBrowser "Hiển thị UI (false = Headless)"
        DateTime createdAt "Ngày tạo"
        DateTime updatedAt "Ngày cập nhật"
    }
\`\`\`

---

## 4. Luồng xử lý chính (Main Workflow)

Kịch bản tự động hóa từ khi bật Profile đến lúc lách Google/GA4 thành công. Trả lời câu hỏi: _"Logic lõi của ứng dụng hoạt động theo trình tự nào?"_

\`\`\`mermaid
flowchart TD
    %% Định nghĩa các style
    classDef ui fill:#3b82f6,stroke:#1e40af,stroke-width:2px,color:#fff
    classDef main fill:#10b981,stroke:#047857,stroke-width:2px,color:#fff
    classDef db fill:#f59e0b,stroke:#b45309,stroke-width:2px,color:#fff
    classDef browser fill:#8b5cf6,stroke:#5b21b6,stroke-width:2px,color:#fff
    classDef action fill:#ef4444,stroke:#b91c1c,stroke-width:2px,color:#fff
    classDef decision fill:#64748b,stroke:#334155,stroke-width:2px,color:#fff

    subgraph Renderer ["🖥️ Frontend (React / Vite)"]
        UI1("Nhấn nút Start"):::ui --> UI2("Gọi IPC: start-automation"):::ui
    end

    subgraph ElectronMain ["⚙️ Backend (Electron Main)"]
        M1("IPC Handler nhận request"):::main --> M2("Kiểm tra trạng thái Profile"):::main
        M2 --> M3{"Browser đã chạy?"}:::decision
    end

    subgraph DB_Query ["🗄️ Database (Prisma)"]
        D1[("Lấy thông tin Profile")]:::db
    end

    subgraph Launching ["🚀 Khởi tạo Profile (browserEngine.ts)"]
        L1("Resolve Service (API / Auth)"):::browser
        L2("Khởi chạy Chromium (Persistent Context)"):::browser
        L3("Inject Stealth Scripts (Fake Navigator/Plugins/Webdriver)"):::browser
    end

    subgraph Automation ["🤖 Quá trình Tự động hóa (startAutomation)"]
        A1("Navigate tới google.com"):::action
        A2{"Dính Auth?"}:::decision
        A3("Clear Cookies & Dừng lại"):::action
        A4("Mô phỏng chuột người thật (Move/Wait)"):::action
        A5("Gõ Keyword từng ký tự (In-page JS Event)"):::action
        A6("Submit & Tìm Link theo Domain"):::action
        A7("Click Link (Xoá target _blank)"):::action
        A8("Tương tác On-page (Scroll/Đọc báo)"):::action
        A9("Click Internal Link (Multi-Page Engagement)"):::action
        A10("Hoàn thành & Cập nhật Run Count"):::action
    end

    %% Liên kết các node
    UI2 --> M1
    M3 -- Không --> D1
    M3 -- Có --> A1

    D1 --> L1
    L1 --> L2
    L2 --> L3
    L3 --> A1

    A1 --> A2
    A2 -- Có --> A3
    A2 -- Không --> A4
    A4 --> A5
    A5 --> A6
    A6 -->|Check Auth lần 2| A2
    A6 -->|Tìm thấy Domain| A7
    A7 --> A8
    A8 --> A9
    A9 --> A10
\`\`\`

---

## 5. Sơ đồ Tuần tự (Sequence Diagram)

Mô tả chi tiết việc gọi hàm và trả kết quả giữa các Component theo trục thời gian. Đặc biệt hữu ích khi debug lỗi giao tiếp IPC hoặc lỗi Bot. Trả lời câu hỏi: _"Các component liên lạc với nhau vào lúc nào?"_

\`\`\`mermaid
sequenceDiagram
    autonumber

    actor User as 🧑‍💻 Người dùng
    participant UI as 🖥️ React Frontend
    participant IPC as ⚙️ Electron Main (IPC)
    participant DB as 🗄️ Database (Prisma)
    participant BE as 🚀 BrowserEngine
    participant G as 🔍 Google Search
    participant Target as 🎯 Target Website

    User->>UI: Nhấn "Start" hoặc "Chạy Automation"

    %% Bước Khởi tạo Browser
    opt Nếu Browser chưa được khởi chạy
        UI->>IPC: Lệnh \`launch-profile(id)\`
        IPC->>DB: Truy vấn thông tin profile (Service, UserAgent)
        DB-->>IPC: Trả về Profile Config
        IPC->>BE: Gọi \`launchProfile()\`

        Note over BE: Xử lý Service (Dynamic API/Auth)<br/>Khởi chạy Chromium Persistent Context
        BE->>BE: Inject Stealth Plugin & Anti-Detect Scripts
        BE-->>IPC: Trả về trạng thái Ready
        IPC-->>UI: Browser đã sẵn sàng
    end

    %% Bắt đầu Automation
    UI->>IPC: Lệnh \`start-automation(id, keyword, domain)\`
    IPC->>BE: Gọi hàm \`startAutomation()\`

    %% Phase 1: Google Search
    BE->>G: 1. Truy cập \`google.com\` (Tạo Referrer thật)
    G-->>BE: Tải trang chủ

    alt Dính Google Auth
        BE->>BE: Gọi \`clearGoogleCookies()\` xoá dấu vết
        BE-->>IPC: Báo lỗi "Auth Detected" & Ảnh chụp
    else Luồng bình thường (Thành công)
        Note over BE, G: Kịch bản người thật: Delay, Di chuyển chuột ngẫu nhiên
        BE->>G: 2. Click vào ô tìm kiếm
        BE->>G: 3. Gõ \`keyword\` từng ký tự qua JS Context (KeyboardEvent)
        BE->>G: 4. Gửi lệnh Enter
        G-->>BE: Trả về danh sách kết quả tìm kiếm (SERP)
    end

    %% Phase 2: Tìm và click kết quả
    BE->>G: 5. Tìm link chứa \`domain\` mục tiêu
    BE->>G: 6. Cuộn trang đến kết quả (ScrollIntoView)
    BE->>G: 7. Xoá thuộc tính \`target="_blank"\`
    BE->>Target: 8. Click link đích -> Chuyển trang

    %% Phase 3: GA4 Bypass & Tương tác
    Target-->>BE: Trang đích được tải xong
    Note over BE, Target: Bắt đầu quá trình Bypass GA4 (Tạo Engaged Session)
    BE->>Target: 9. Di chuyển chuột, cuộn trang 4-8 lần (Giả lập đọc)
    BE->>Target: 10. Tìm các Internal Link (tránh link login/logout)
    BE->>Target: 11. Click 1 Internal Link ngẫu nhiên
    Target-->>BE: Chuyển sang trang thứ 2
    BE->>Target: 12. Cuộn trang và ngâm time-on-site (10s - 20s)

    %% Phase 4: Hoàn thành
    BE-->>IPC: Trả về \`{ success: true }\`
    IPC->>DB: \`runCount = runCount + 1\` (Cập nhật DB)
    DB-->>IPC: Xác nhận cập nhật thành công
    IPC-->>UI: Thông báo "Automation Hoàn thành"
    UI-->>User: Hiển thị kết quả & Cập nhật UI
\`\`\`

---

## 6. Sơ đồ Trạng thái (State Machine Diagram)

Góc nhìn dành cho **QA Tester & Developer**. Biểu đồ này cực kỳ quan trọng để test các Edge Cases (các trường hợp ngoại lệ). Nó định nghĩa vòng đời (Lifecycle) của một Profile/Tiến trình auto, giúp mọi người biết khi nào bot đang lỗi (Failed), khi nào đang chạy (Running).

\`\`\`mermaid
stateDiagram-v2
    [*] --> Idle: Khởi tạo

    Idle --> Initializing: Nhấn Start
    Initializing --> BrowserLaunched: Load Service & Mở Chrome

    BrowserLaunched --> NavigatingGoogle: Gọi startAutomation

    NavigatingGoogle --> AuthDetected: Dính Auth
    NavigatingGoogle --> TypingKeyword: Pass Auth (Bình thường)

    TypingKeyword --> Searching: Gõ xong & Enter
    Searching --> AuthDetected: Check Auth lần 2
    Searching --> TargetNotFound: Không thấy Domain
    Searching --> ClickingTarget: Tìm thấy Link đích

    ClickingTarget --> OnTargetSite: Đang ở trang đích
    OnTargetSite --> MultiPageEngagement: Click Internal Link

    MultiPageEngagement --> Completed: Hoàn thành (Update RunCount)

    AuthDetected --> Failed: Xóa Cookies & Dừng
    TargetNotFound --> Failed: Báo lỗi Keyword

    Completed --> [*]
    Failed --> [*]
\`\`\`

---

## 7. Sơ đồ Triển khai (Deployment / Infrastructure Diagram)

Góc nhìn dành cho **DevOps, SysAdmin & Client Setup**. Trả lời câu hỏi: _"Khi build ra file \`.exe\`/\`.dmg\`, phần mềm lưu data ở đâu? Nó gọi ra mạng qua cổng nào?"_. Rất quan trọng khi hỗ trợ khách hàng cài đặt (support).

\`\`\`mermaid
flowchart TD
    classDef hardware fill:#475569,stroke:#1e293b,stroke-width:2px,color:#fff
    classDef software fill:#3b82f6,stroke:#1e40af,stroke-width:2px,color:#fff
    classDef file fill:#f59e0b,stroke:#b45309,stroke-width:2px,color:#fff

    subgraph OS ["💻 Máy tính Khách hàng (Windows / macOS)"]
        direction TB
        App["📦 AppMaster App (App.exe / App.dmg)"]:::software
        DataDir["📁 Thư mục Local AppData (~/.config hoặc %AppData%)"]:::hardware

        LocalDB[("🗄️ Database (db.sqlite)")]:::file
        ProfileData["📂 UserData Chrome (Cookies, Cache)"]:::file
        Engine["🌐 Trình duyệt Chromium (Tải ngầm Engine)"]:::software

        App -->|Đọc / Ghi cấu hình| LocalDB
        App -->|Khởi chạy| Engine
        Engine -->|Lưu state| ProfileData

        DataDir -. Chứa .-> LocalDB
        DataDir -. Chứa .-> ProfileData
    end

    subgraph Network ["🌍 Network & Security"]
        Service["🛡️ Service / VPN Server (Thay đổi IP Public)"]:::hardware
    end

    subgraph Cloud ["☁️ Internet"]
        Google["🔍 Máy chủ Google Search"]:::software
        Target["🎯 Target Web Server"]:::software
    end

    Engine <-->|Traffic HTTPS| Service
    Service <-->|Bypass Bot Detect| Google
    Service <-->|Bypass GA4| Target
\`\`\`

---

## 8. Sơ đồ Hành trình Người dùng (User Journey Map)

Góc nhìn dành cho **Product Designer (PD) & UX/UI Designer**. Họ không quan tâm code chạy ngầm ra sao, họ chỉ quan tâm "Trải nghiệm của khách hàng đi từ A đến Z như thế nào?". Sơ đồ này đo lường cảm xúc và các điểm chạm (touchpoints) của User với ứng dụng.

\`\`\`mermaid
journey
    title Trải nghiệm sử dụng App Master của Khách hàng

    section 1. Thiết lập Hệ thống (Onboarding)
      Tải & Cài đặt App: 5: User
      Nhập Key Service / API Đổi IP: 4: User, System

    section 2. Cấu hình Chiến dịch (Campaign)
      Tạo Profile mới: 5: User
      Nhập Keyword & Domain cần SEO: 5: User
      Chọn chế độ Headless (Ẩn UI): 4: User

    section 3. Thực thi & Tự động hoá
      Bấm nút Start Automation: 5: User
      Chờ Bot Handle Auth: 3: System
      Chờ Bot lướt web tăng GA4: 4: System

    section 4. Đo lường (Analytics)
      Kiểm tra Run Count trên App: 5: User
      Check Google Search Console: 5: User
\`\`\`

---

## 9. Sơ đồ Cấu trúc Tính năng (Feature Mind Map / WBS)

Góc nhìn dành cho **Product Owner (PO) & Product Manager (PM)**. Đây là tài liệu cốt lõi để PO phân rã các tính năng (Epic) thành các User Stories nhỏ hơn để đẩy vào Backlog cho Dev làm. Khi nhìn vào đây, PM sẽ biết "Product này đang có bao nhiêu nhóm tính năng lớn?".

\`\`\`mermaid
mindmap
  root((App Master<br/>Core Product))
    Quản lý Profile
      Tạo / Sửa / Xóa
      Nhập xuất (Import/Export)
      Cấu hình Fingerprint
    Quản lý Service
      Hỗ trợ Service Tĩnh (Auth)
      Hỗ trợ Service API (Xoay IP)
      Tự động Anonymize
    Tự động hóa (Core Engine)
      Tìm kiếm Keyword
      Handle Auth
      Multi-Page Engagement
      Gõ phím ngẫu nhiên
    Giao diện & Cài đặt
      Chạy Headless / UI
      Thống kê lượt chạy (Run Count)
      Clear Data rác
\`\`\`

---

## 10. Sơ đồ Quy trình Làm việc & Quản lý Source Code (Git Flow)

Góc nhìn dành cho **Technical Lead & Toàn bộ Developer**. Khi dự án có từ 2 Dev trở lên, sơ đồ này quy định luật chơi: _Nhánh nào dùng để code tính năng mới? Nhánh nào dùng để Test? Khi nào thì được Merge code lên môi trường Producton?_

\`\`\`mermaid
gitGraph
    commit id: "Khởi tạo Repo"
    branch develop
    checkout develop
    commit id: "Setup Electron Vite"

    %% Dev 1 làm tính năng
    branch feature/stealth-bot
    checkout feature/stealth-bot
    commit id: "Tích hợp Engine"
    commit id: "Xử lý Bypass Auth"

    %% Gom code vào develop
    checkout develop
    merge feature/stealth-bot

    %% Chuẩn bị Release
    branch release/v1.0
    checkout release/v1.0
    commit id: "Fix bugs & Đóng gói App"

    %% Đưa lên Production
    checkout main
    merge release/v1.0 tag: "v1.0.0 (Live)"

    %% Cập nhật ngược lại develop
    checkout develop
    merge main
\`\`\`

---

## 11. Sơ đồ Lộ trình Phát triển (Product Roadmap / Gantt Chart)

Góc nhìn dành cho **Project Manager (PM) & C-Level (Giám đốc/Nhà đầu tư)**. Họ cần biết dự án đang ở giai đoạn nào, tốn bao nhiêu thời gian cho từng Module, và ngày nào thì Launch được sản phẩm (Release).

\`\`\`mermaid
gantt
    title Lộ trình Phát triển App Master (Mẫu Q3/2026)
    dateFormat  YYYY-MM-DD
    axisFormat  %d/%m

    section 1. Lõi Hệ thống (Core)
    Khởi tạo Electron & UI       :done,    task1, 2026-05-01, 5d
    Tích hợp DB Prisma           :done,    task2, after task1, 3d
    Cấu hình Service & Engine  :active,  task3, after task2, 7d

    section 2. Auto & AI
    Kịch bản vượt Auth        :         task4, after task3, 10d
    Kịch bản Multi-Page GA4      :         task5, after task4, 7d

    section 3. QA & Release
    Kiểm thử Edge Cases (QA)     :         task6, after task5, 5d
    Đóng gói App (.exe / .dmg)   :         task7, after task6, 3d
    Launch v1.0.0                :milestone, m1, after task7, 0d
\`\`\`

---

## 12. Sơ đồ Cấu trúc Giao diện (Frontend Component Tree)

Góc nhìn dành cho **Frontend Developer (React/Vue)**. Khi sửa một nút bấm trên UI hoặc thêm một màn hình mới, Dev cần biết component nào đang ôm component nào, state truyền từ đâu xuống đâu để không phá vỡ cấu trúc Layout chung.

\`\`\`mermaid
flowchart TD
    classDef root fill:#1e293b,stroke:#0f172a,color:#fff
    classDef layout fill:#3b82f6,stroke:#1d4ed8,color:#fff
    classDef page fill:#10b981,stroke:#047857,color:#fff
    classDef comp fill:#6366f1,stroke:#4338ca,color:#fff

    App["⚛️ App (Root Context/Provider)"]:::root

    Layout["🪟 MainLayout"]:::layout
    Sidebar["🧭 Sidebar (Navigation)"]:::comp
    Content["📄 PageContent (Router Outlet)"]:::layout

    PageProfile["👥 ProfilePage"]:::page
    Table["📊 ProfileTable (Danh sách)"]:::comp
    ModalCreate["➕ CreateProfileModal"]:::comp
    ModalConfig["⚙️ ServiceConfigModal"]:::comp

    PageSetting["🔧 SettingPage"]:::page
    Form["📝 GlobalSettingsForm"]:::comp

    App --> Layout
    Layout --> Sidebar
    Layout --> Content

    Content --> PageProfile
    Content --> PageSetting

    PageProfile --> Table
    PageProfile --> ModalCreate
    PageProfile --> ModalConfig

    PageSetting --> Form
\`\`\`

---

## 13. Sơ đồ Lớp & Cấu trúc Kiểu dữ liệu (Class / Type Diagram)

Góc nhìn dành cho **Backend / Core Developer**. Đặc biệt hữu ích trong các project TypeScript hoặc OOP (Java/C#). Sơ đồ này cho biết lõi logic bao gồm những \`Class\`, \`Interface\` hay \`Struct\` nào, hàm nào gọi hàm nào, thuộc tính \`private\` (-) hay \`public\` (+).

\`\`\`mermaid
classDiagram
    class Profile {
        +String id
        +String name
        +String userAgent
        +String Service
        +int runCount
    }

    class IpcHandlers {
        +registerIpcHandlers()
    }

    class BrowserEngine {
        -Map activeBrowsers
        +checkAndInstallBrowser()
        +resolveService(ServiceStr) ServiceConfig
        +launchProfile(profileId, headless)
        +startAutomation(profileId, keyword, domain)
        +closeProfile(profileId)
    }

    class ServiceConfig {
        <<interface>>
        +String server
        +String username
        +String password
    }

    BrowserEngine ..> Profile : Phụ thuộc (Uses)
    BrowserEngine ..> ServiceConfig : Trả về (Returns)
    IpcHandlers --> BrowserEngine : Gọi hàm (Calls)
\`\`\`

---

## 14. Sơ đồ Yêu cầu Kỹ thuật (Requirement Traceability)

Góc nhìn dành cho **Chủ đầu tư (Client), Khách hàng, PM và BA (Business Analyst)**. Biểu đồ này hay dùng trong các dự án Outsourcing (Gia công phần mềm) để nghiệm thu hợp đồng. Mỗi một cục \`Requirement\` là một dòng cam kết trong hợp đồng, phải test pass thì khách mới thanh toán tiền.

\`\`\`mermaid
requirementDiagram
    requirement CORE_REQ {
        id: 1
        text: Khoi tao Profile tu dong
        risk: high
        verifyMethod: test
    }

    functionalRequirement Auth_REQ {
        id: 2
        text: Xu ly Auth
        risk: high
        verifyMethod: test
    }

    performanceRequirement GA4_REQ {
        id: 3
        text: Tuong tac trang dich hon 10s
        risk: medium
        verifyMethod: analysis
    }

    interfaceRequirement Service_REQ {
        id: 4
        text: Nap API Service
        risk: low
        verifyMethod: demonstration
    }

    CORE_REQ - contains -> Auth_REQ
    CORE_REQ - contains -> GA4_REQ
    CORE_REQ - contains -> Service_REQ
\`\`\`

---

## 15. Sơ đồ Phân rã Công việc (Work Breakdown Structure - WBS)

Góc nhìn dành cho **Project Manager (PM) & Scrum Master**. Trả lời câu hỏi: _"Từ một cục tính năng khổng lồ (Epic), làm sao cắt nhỏ ra cho Dev code mỗi ngày?"_.
Đây là "bản phác thảo" trước khi tạo Ticket trên Jira/Trello. Nó bẻ từ Epic -> Feature -> Task -> Sub-task.

\`\`\`mermaid
flowchart TD
    classDef epic fill:#8b5cf6,stroke:#5b21b6,color:#fff,stroke-width:2px
    classDef feature fill:#3b82f6,stroke:#1e40af,color:#fff,stroke-width:2px
    classDef task fill:#10b981,stroke:#047857,color:#fff,stroke-width:2px

    Epic["EPIC: Xây dựng Core Automation Bot"]:::epic

    F1["Feature 1: Quản lý Profile"]:::feature
    F2["Feature 2: Tích hợp Service"]:::feature
    F3["Feature 3: Bot tương tác ngẫu nhiên"]:::feature

    Epic --> F1
    Epic --> F2
    Epic --> F3

    %% Rã Task cho Feature 1
    F1 --> T1_1["Task: Tạo DB Schema (Prisma)"]:::task
    F1 --> T1_2["Task: Làm form UI (React/Vite)"]:::task
    F1 --> T1_3["Task: API lấy danh sách Profile"]:::task

    %% Rã Task cho Feature 2
    F2 --> T2_1["Task: Code API xoay IP Cloud API Service"]:::task
    F2 --> T2_2["Task: Xử lý HTTP Service Auth"]:::task
    F2 --> T2_3["Task: Inject vào Engine"]:::task

    %% Rã Task cho Feature 3
    F3 --> T3_1["Task: Logic bắt lỗi Auth"]:::task
    F3 --> T3_2["Task: Code gõ phím KeyboardEvent"]:::task
    F3 --> T3_3["Task: Logic cuộn trang (Scroll)"]:::task
    F3 --> T3_4["Task: Click Internal Link"]:::task
\`\`\`

---

## 16. Ma trận Ưu tiên Tính năng (Quadrant Chart / Prioritization Matrix)

Góc nhìn dành cho **Product Owner (PO) & CEO**. Khi có quá nhiều tính năng (WBS) mà nguồn lực Dev thì có hạn, PO sẽ dùng sơ đồ này để đánh giá: _Tính năng nào mang lại Giá trị cao (High Value) mà lại Ít tốn công (Low Effort) để ưu tiên làm trước (Quick Wins)_. Sơ đồ này "cứu mạng" dự án khỏi việc đốt tiền vào những tính năng vô bổ.

\`\`\`mermaid
quadrantChart
    title "Ma trận Ưu tiên Tính năng (Value vs. Effort)"
    x-axis "Tốn ít công (Low Effort)" --> "Tốn nhiều công (High Effort)"
    y-axis "Ít giá trị (Low Value)" --> "Nhiều giá trị (High Value)"
    quadrant-1 "Chiến lược Dài hạn (Làm từ từ)"
    quadrant-2 "Hái ra tiền (ƯU TIÊN LÀM NGAY)"
    quadrant-3 "Không đáng làm (Bỏ qua)"
    quadrant-4 "Cân nhắc (Có thể làm sau)"

    "Handle Auth": [0.85, 0.95]
    "Quản lý Profile cơ bản": [0.15, 0.90]
    "Tích hợp API Cloud API Service": [0.30, 0.85]
    "Lướt nhiều trang (GA4)": [0.60, 0.80]
    "Xuất báo cáo Excel": [0.40, 0.40]
    "UI/UX Quá Bóng bẩy": [0.75, 0.35]
    "Đồng bộ Cloud": [0.90, 0.60]
\`\`\`

---

## 17. Sơ đồ Kiến trúc Vật lý (Physical Architecture)

Góc nhìn dành cho **Cloud Architect & System Engineer**. Đây là một tính năng cực mới của Mermaid (\`architecture-beta\`). Thay vì vẽ ô vuông nhàm chán, nó cung cấp các Icon chuẩn quốc tế để biểu diễn các cụm máy chủ, cơ sở dữ liệu và luồng mạng một cách trực quan nhất.

\`\`\`mermaid
architecture-beta
    group local(monitor)["Máy tính Khách hàng"]

    service ui(internet)["Giao diện React"] in local
    service node(server)["Core Node.js"] in local
    service sqlite(database)["SQLite DB"] in local

    group net(cloud)["Môi trường Mạng"]
    service Service(server)["Service Server"] in net
    service google(internet)["Google / Websites"] in net

    ui:R -- L:node
    node:B -- T:sqlite
    node:R -- L:Service
    Service:R -- L:google
\`\`\`

---

## 18. Sơ đồ Lịch sử Phiên bản (Timeline / Changelog)

Góc nhìn dành cho **Customer Support & Khách hàng**. Thay vì đọc một file \`CHANGELOG.md\` toàn chữ nhàm chán, biểu đồ này tóm tắt chặng đường phát triển của dự án, giúp team Sale/Support khoe được tiến độ cập nhật với khách hàng.

\`\`\`mermaid
timeline
    title Lịch sử Cập nhật App Master
    Tháng 5/2026 : v1.0.0 Alpha
                 : Khởi tạo Core React & Electron
                 : Tích hợp Engine
    Tháng 6/2026 : v1.1.0 Beta
                 : Cơ chế Bypass Auth
                 : Xoay IP API Service VN
    Tháng 7/2026 : v1.2.0 Stable
                 : Cơ chế Multi-Page GA4
                 : Fix lỗi Memory Leak
    Tháng 8/2026 : v2.0.0 Pro
                 : Đồng bộ Cloud Database
                 : Quản lý hàng nghìn Profile
\`\`\`

---

## 19. Biểu đồ Phân bổ (Pie Chart)

Góc nhìn dành cho **Data Analyst (DA) & Kỹ sư Hệ thống**. Đánh giá xem hệ thống đang "chảy máu" ở đâu. Ví dụ: Khi có 1000 lỗi xảy ra thì nguyên nhân chủ yếu nằm ở khâu nào? Sơ đồ này giúp Tech Lead quyết định tuần tới phải tập trung sửa lỗi gì.

\`\`\`mermaid
pie title Tỷ lệ Các loại Lỗi khi chạy Automation (Tháng 5/2026)
    "Google chặn Auth" : 45
    "Service Timeout / Lỗi mạng" : 30
    "Không tìm thấy Keyword" : 15
    "Crash Trình duyệt" : 10
\`\`\`

---

## 20. Biểu đồ Dòng chảy Phễu (Sankey Diagram)

Góc nhìn dành cho **Growth Hacker & Marketing**. Sơ đồ Sankey mô tả "Dòng chảy" (Flow) của một đại lượng. Dưới đây là phễu (Funnel) lưu lượng chạy Bot: Từ 10,000 phiên chạy khởi tạo, bao nhiêu phiên lọt qua được cửa Auth, bao nhiêu phiên nán lại trang đích thành công để tạo ra Traffic "Thật"?

\`\`\`mermaid
---
config:
  sankey:
    showValues: true
---
sankey-beta

Khoi Tao Profile,Service Mang,10000
Service Mang,Pass Auth,7000
Service Mang,Timeout Error,3000
Pass Auth,Trang Dich (Target),6500
Pass Auth,Loi Keyword,500
Trang Dich (Target),Tuong Tac GA4,5000
Trang Dich (Target),Thoat Som,1500
\`\`\`

---

## 21. Biểu đồ Thống kê Hiệu suất (XY Bar/Line Chart)

Góc nhìn dành cho **Dashboard Monitor / System Admin**. Sơ đồ phân tích định lượng dữ liệu theo trục tung và trục hoành. Rất thích hợp để vẽ biểu đồ đo lường hiệu năng của Server (CPU, RAM) hoặc Tốc độ hoàn thành công việc theo từng khung giờ trong ngày.

\`\`\`mermaid
xychart-beta
    title "Tốc độ chạy Bot thành công theo Khung giờ (Lượt/giờ)"
    x-axis ["00:00", "04:00", "08:00", "12:00", "16:00", "20:00"]
    y-axis "Số lượt Bot Pass" 0 --> 500
    bar [120, 50, 300, 450, 400, 250]
    line [100, 40, 280, 400, 380, 200]
\`\`\`

---

## 22. Sơ đồ Ngữ cảnh Hệ thống (C4 Model - Context Diagram)

Góc nhìn dành cho **Enterprise Architect & Các Sếp lớn (C-Level)**. C4 Model là chuẩn công nghiệp cao cấp nhất hiện nay. Ở mức Context (Level 1), nó hoàn toàn bỏ qua tiểu tiết code (không quan tâm React hay DB gì), chỉ vẽ ra bức tranh toàn cảnh: Hệ thống của bạn đang giao tiếp với những Hệ thống to lớn nào bên ngoài thế giới thực?

\`\`\`mermaid
C4Context
    title C4 Model (Level 1) - System Context cho App Master

    Person(user, "System Admin", "Nhân viên SEO thiết lập chiến dịch và theo dõi kết quả")

    System(bot, "App Master System", "Hệ thống lõi tự động hóa trình duyệt để kéo Traffic")

    System_Ext(google, "Google Search", "Bộ máy tìm kiếm khổng lồ (Nơi bị đánh lừa)")
    System_Ext(target, "Target Website", "Trang web đích cần đẩy chỉ số GA4")
    System_Ext(Service, "Cloud Provider", "Hệ thống đối tác cấp phát IP sạch (Ví dụ: Cloud API Service)")

    Rel(user, bot, "Tạo chiến dịch & Theo dõi tiến độ", "Desktop App")
    Rel(bot, google, "Gửi lượt Search & Vượt Auth", "HTTPS / Engine")
    Rel(bot, target, "Tương tác, cuộn trang > 10s", "HTTPS")
    Rel(bot, Service, "Lấy IP mới sau mỗi lượt chạy", "REST API")
\`\`\`

---

## 23. Bảng Phân công Công việc (Kanban Block Diagram)

Góc nhìn dành cho **Scrum Master & Team Development**. Lợi dụng tính năng \`block-beta\` cực mới của Mermaid, chúng ta có thể vẽ hẳn một bảng Kanban (To Do / Doing / Done) ngay trong tài liệu Markdown để mọi người biết task nào đang nằm ở cột nào mà không cần mở Trello hay Jira!

\`\`\`mermaid
---
config:
  kanban:
    ticketBaseUrl: 'https://jira.com/browse/#TICKET#'
---
kanban
  Todo
    [Tích hợp API Cloud API Service]@{ ticket: ORG-101 }
    [Tính năng Auto-Update]@{ ticket: ORG-102, priority: 'Low' }
  [In progress]
    [Xử lý reAuth v3 Google]@{ ticket: ORG-103, assigned: 'Dev1', priority: 'High' }
  Done
    [Thiết kế UI bằng React]@{ ticket: ORG-104, assigned: 'DesignTeam' }
    [Setup Core Engine]@{ ticket: ORG-105, priority: 'Very High' }
\`\`\`

---

## 24. Biểu đồ Gói tin Hệ thống (Network Packet / IPC Payload)

Góc nhìn dành cho **Security Engineer & Kỹ sư Mạng (Network)**. Đây là cú pháp siêu dị và hiếm người biết của Mermaid (\`packet-beta\`). Dùng để thiết kế cấu trúc Byte/Bit của một gói tin mạng, hoặc ở đây là cấu trúc gói tin (Message Payload) bắn qua lại giữa giao diện UI và Backend Electron (IPC Bridge). Cực kỳ hữu ích khi phải debug bắt gói tin.

\`\`\`mermaid
packet-beta
    title Cấu trúc Gói tin IPC (Message Payload) gửi từ UI xuống Core
    0-15: "Header: event_name"
    16-23: "Action: START"
    24-31: "profileId: (UUID)"
    32-47: "keyword: (String)"
    48-63: "domain: (String)"
\`\`\`

---

## 25. Sơ đồ Kiến trúc Container (C4 Model - Container Diagram)

Góc nhìn dành cho **Solution Architect & Software Engineer**. Đây là **Level 2** của chuẩn C4 Model (Zoom sâu hơn sơ đồ 22). Ở mức này, ta mở hộp đen "App Master System" ra để xem bên trong nó chứa những thùng chứa (Container) nào: Dùng công nghệ gì (React, Node, Prisma, Engine) và các thùng chứa nói chuyện với nhau ra sao.

\`\`\`mermaid
C4Container
    title C4 Model (Level 2) - Container Diagram cho App Master

    Person(user, "System Admin", "Người cấu hình và chạy tool")

    System_Boundary(c1, "App Master Desktop App") {
        Container(ui, "React Frontend", "Vite, Zustand", "Giao diện cấu hình Profile và báo cáo")
        Container(main, "Electron Backend", "Node.js", "Xử lý IPC, điều phối các tiến trình tự động")
        ContainerDb(db, "Local SQLite", "Prisma ORM", "Lưu trữ Profile, Service, Lịch sử chạy")
        Container(browser, "Headless Browser", "Engine + Stealth", "Trình duyệt tự động lướt web (Worker)")
    }

    System_Ext(Service, "Cloud API Service API", "Hệ thống cung cấp IP")
    System_Ext(google, "Google Search", "Mục tiêu tìm kiếm")

    Rel(user, ui, "Tương tác qua", "UI / Click")
    Rel(ui, main, "Gửi lệnh qua", "IPC Bridge")
    Rel(main, db, "Đọc/Ghi dữ liệu", "Prisma Client")
    Rel(main, browser, "Khởi chạy & ra lệnh", "CDP Protocol")

    Rel(browser, Service, "Định tuyến traffic", "HTTP Service")
    Rel(browser, google, "Mô phỏng hành vi", "HTTPS")
\`\`\`

---

## 26. Sơ đồ Mô hình Hóa Rủi ro (Threat Model / Attack Vector)

Góc nhìn dành cho **Security Engineer / CISO / Hacker**. Bất kỳ phần mềm uy tín nào trước khi Launch đều phải trải qua bước "Đánh giá Rủi ro". Sơ đồ này chỉ thẳng mặt những Điểm yếu (Vulnerabilities) đang nằm ở đâu trong Code, và Mối đe dọa (Threats) nào có thể lợi dụng nó để đánh sập ứng dụng hoặc ăn cắp dữ liệu của User. Nhìn vào đây Dev sẽ biết phải vá code chỗ nào.

\`\`\`mermaid
flowchart TD
    classDef actor fill:#3b82f6,color:#fff,stroke-width:0
    classDef system fill:#8b5cf6,color:#fff,stroke-width:0
    classDef risk fill:#ef4444,color:#fff,stroke-width:0
    classDef vuln fill:#f59e0b,color:#fff,stroke-width:0

    User["👨‍💻 Người dùng"]:::actor
    App["💻 App App Master"]:::system
    Network["🌐 Môi trường Internet"]:::system

    User -->|Sử dụng| App
    App -->|Giao tiếp| Network

    subgraph Vulnerabilities ["⚠️ Điểm yếu Hệ thống (Vulnerabilities)"]
        V1["V1: SQLite lưu Session/Cookie không mã hóa"]:::vuln
        V2["V2: Lộ API Key Service (Cloud API Service) trên màn hình"]:::vuln
        V3["V3: Lỗi rò rỉ WebRTC lộ IP Thật"]:::vuln
    end

    subgraph Threats ["☠️ Rủi ro / Mối đe dọa (Threats)"]
        T1["☠️ Bị Malware ăn cắp File SQLite lấy mất Cookie"]:::risk
        T2["☠️ Google cập nhật thuật toán Detect Bot mới"]:::risk
        T3["☠️ Bị lộ thông tin mạng thật, Google phạt toàn bộ domain"]:::risk
    end

    App -.-> V1
    App -.-> V2
    App -.-> V3

    V1 ==> T1
    Network ==> T2
    V3 ==> T3
\`\`\`

---

## 27. Sơ đồ Kiến trúc Sạch (Clean Architecture / Onion Architecture)

Góc nhìn dành cho **Chief Technology Officer (CTO) & Software Architect**. Đây là đỉnh cao của thiết kế phần mềm. Sơ đồ này chứng minh rằng Core Logic (Lõi nghiệp vụ) của bạn hoàn toàn độc lập với UI hay Database. Ngày mai bạn muốn vứt React đổi sang Vue, hay vứt SQLite đổi sang MongoDB, thì Lõi nghiệp vụ (Domain/Use Cases) vẫn không cần sửa một dòng code nào!

\`\`\`mermaid
flowchart TD
    classDef infra fill:#3b82f6,color:#fff,stroke-width:0px
    classDef adapter fill:#10b981,color:#fff,stroke-width:0px
    classDef usecase fill:#f59e0b,color:#fff,stroke-width:0px
    classDef domain fill:#ef4444,color:#fff,stroke-width:0px

    subgraph Infrastructure ["🔵 Vòng ngoài: Hạ tầng & Frameworks (Thay đổi liên tục)"]
        UI["React UI (Vite)"]:::infra
        DB["SQLite (Prisma)"]:::infra
        Browser["Engine Chromium"]:::infra
    end

    subgraph Adapters ["🟢 Vòng 2: Chuyển đổi Giao tiếp (Interface Adapters)"]
        IPC["IPC Handlers (Cầu nối UI-Core)"]:::adapter
        Controller["Browser Controller"]:::adapter
        Repository["Profile Repository"]:::adapter
    end

    subgraph UseCases ["🟡 Vòng 3: Nghiệp vụ Ứng dụng (Application Use Cases)"]
        StartAuto["Bắt đầu Kịch bản Auto (StartAutomation)"]:::usecase
        ManageProf["Quản lý Sinh/Xóa Profile (ManageProfile)"]:::usecase
    end

    subgraph Domain ["🔴 Lõi trung tâm: Cấu trúc Dữ liệu gốc (Domain Entities)"]
        ProfileEntity["Entity: Profile (ID, Tên, Service, RunCount)"]:::domain
    end

    Infrastructure -->|Phụ thuộc chiều sâu| Adapters
    Adapters -->|Phụ thuộc chiều sâu| UseCases
    UseCases -->|Phụ thuộc chiều sâu| Domain
\`\`\`

---

## 28. Cây Quyết định Khắc phục Sự cố (Troubleshooting Decision Tree)

Góc nhìn dành cho **Customer Service (CS) & Đội Vận hành (Operations)**. Khi khách hàng gọi điện la làng _"Em ơi Tool lỗi không chạy được"_, nhân viên Support chỉ cần nhìn vào sơ đồ này, hỏi khách hàng từng câu từ trên xuống dưới để "bắt đúng bệnh" và chỉ đúng thuốc, không cần phải gọi réo Developer.

\`\`\`mermaid
flowchart TD
    classDef start fill:#8b5cf6,color:#fff,stroke-width:0
    classDef question fill:#f59e0b,color:#fff,stroke-width:0
    classDef fix fill:#10b981,color:#fff,stroke-width:0
    classDef dev fill:#ef4444,color:#fff,stroke-width:0

    Start{"Khách báo Bot bị lỗi?"}:::start
    Start -->|Vừa bấm Start đã báo lỗi| CheckDB{"Check Database"}:::question
    Start -->|Mở Chrome lên rồi văng ngay| CheckService{"Check Service/Mạng"}:::question
    Start -->|Chạy giữa chừng thì kẹt lại| CheckAuth{"Bị kẹt Auth?"}:::question

    CheckDB -->|Mất file / Chế độ Read-only| FixDB["Bảo khách chạy App bằng quyền Admin"]:::fix
    CheckDB -->|Database bình thường| CheckLog["Bật DevTools gửi Log cho Dev"]:::dev

    CheckService -->|Service chết/Hết hạn| FixService["Mua Service mới nhập vào"]:::fix
    CheckService -->|Service sống| FixBrowser["Xóa thư mục Chromium tải lại"]:::fix

    CheckAuth -->|Google hiện Auth hình ảnh| FixScript["Tăng thời gian Delay giả lập người thật"]:::fix
    CheckAuth -->|Trang trắng bóc / Lỗi giao diện| FixSelector["DOM Google đổi, báo Dev update Code"]:::dev
\`\`\`

---

## 29. Đường ống Triển khai Tự động (CI/CD Pipeline)

Góc nhìn dành cho **DevOps Engineer & Release Manager**. Bức tranh cuối cùng của một chu kỳ làm phần mềm: Từ dòng code của Dev trên máy tính, làm sao nó biến thành file \`.exe\` hay \`.dmg\` tự động cập nhật vào máy khách hàng một cách mượt mà nhất mà không cần ai thức đêm build tay?

\`\`\`mermaid
flowchart LR
    classDef git fill:#f14e32,color:#fff,stroke-width:0
    classDef action fill:#2088ff,color:#fff,stroke-width:0
    classDef build fill:#f59e0b,color:#fff,stroke-width:0
    classDef release fill:#10b981,color:#fff,stroke-width:0

    Push["Dev Push Code<br>(Nhánh Main)"]:::git
    GH["GitHub Actions<br>(Kích hoạt)"]:::action

    Push --> GH

    subgraph Pipeline ["⚙️ CI/CD Automation Pipeline"]
        direction TB
        Test["Chạy Unit Tests & Lint"]:::build
        BuildWin["Đóng gói .exe (Windows)"]:::build
        BuildMac["Đóng gói .dmg (macOS)"]:::build
        Sign["Code Signing / Notarize<br>(Tránh cảnh báo Virus)"]:::build

        Test --> BuildWin & BuildMac
        BuildMac --> Sign
        BuildWin --> Sign
    end

    GH --> Pipeline

    Release["Tạo GitHub Release mới<br>(Bắn Noti Update)"]:::release
    Pipeline --> Release

    Client["Client App Khách hàng<br>Tự động tải bản mới"]:::git
    Release --> Client
\`\`\`

---

## 30. Sơ đồ Tập hợp Giao nhau (Logical Venn Diagram)

Góc nhìn dành cho **Product Manager & Strategist**. Đây là sơ đồ biểu diễn các tập hợp giao nhau, chứng minh "Sự kết hợp của 3 yếu tố cốt lõi sẽ tạo ra một Sản phẩm Hoàn hảo (App Master)".

\`\`\`mermaid
venn-beta
    title Điểm Giao thoa Cốt lõi của App Master
    set Engine
    set Service
    set Profile
    union Engine,Service["Vượt Auth"]
    union Service,Profile["Ẩn danh"]
    union Engine,Profile["Máy Thật"]
    union Engine,Service,Profile["SEO Master"]
    style Engine,Service fill:#3b82f6
    style Service,Profile fill:#f59e0b
    style Engine,Profile fill:#10b981
    style Engine,Service,Profile fill:#ef4444, color:#fff
\`\`\`
`;async function Pe(){try{let e=await localforage.getItem(m);return e?typeof e==`string`?JSON.parse(e):e:[]}catch{return[]}}function N(e){try{localforage.setItem(m,e)}catch(e){console.warn(`Failed to save AppState.tabs to localforage:`,e)}}async function Fe(){return await localforage.getItem(h)}function P(e){localforage.setItem(h,e)}async function Ie(){let e=await localforage.getItem(g);return parseInt(e||`0`,10)}function Le(e){localforage.setItem(g,String(e))}function Re(){return y.untitledCounter=(y.untitledCounter||0)+1,Le(y.untitledCounter),`Untitled `+y.untitledCounter}var F=[{name:`gray`,bg:`rgba(156,163,175,0.25)`,border:`#9ca3af`,dot:`#9ca3af`},{name:`blue`,bg:`rgba(59,130,246,0.2)`,border:`#3b82f6`,dot:`#3b82f6`},{name:`purple`,bg:`rgba(168,85,247,0.2)`,border:`#a855f7`,dot:`#a855f7`},{name:`green`,bg:`rgba(34,197,94,0.2)`,border:`#22c55e`,dot:`#22c55e`},{name:`yellow`,bg:`rgba(234,179,8,0.25)`,border:`#eab308`,dot:`#eab308`},{name:`orange`,bg:`rgba(249,115,22,0.2)`,border:`#f97316`,dot:`#f97316`},{name:`red`,bg:`rgba(239,68,68,0.2)`,border:`#ef4444`,dot:`#ef4444`},{name:`pink`,bg:`rgba(236,72,153,0.2)`,border:`#ec4899`,dot:`#ec4899`}];async function ze(){try{let e=await localforage.getItem(_);return e?JSON.parse(e):[]}catch{return[]}}function I(){localforage.setItem(_,JSON.stringify(y.tabGroups))}function Be(e,t){let n=F.find(e=>e.name===t)||F[2],r={id:`grp_`+Date.now()+`_`+Math.random().toString(36).slice(2,6),name:e||`New Group`,color:n.name,collapsed:!1};return y.tabGroups.push(r),I(),r}function Ve(e){y.tabs.forEach(t=>{t.groupId===e&&(t.groupId=null)}),y.tabGroups=y.tabGroups.filter(t=>t.id!==e),I(),N(y.tabs),R(y.tabs,y.activeTabId)}function He(e){let t=y.tabGroups.find(t=>t.id===e);if(!t)return;let n=prompt(`Rename group:`,t.name);n!==null&&(t.name=n.trim()||`Unnamed`,I(),R(y.tabs,y.activeTabId))}function Ue(e){let t=y.tabGroups.find(t=>t.id===e);t&&(t.collapsed=!t.collapsed,I(),R(y.tabs,y.activeTabId))}function We(e,t){let n=y.tabGroups.find(t=>t.id===e);n&&(n.color=t,I(),R(y.tabs,y.activeTabId))}function Ge(e,t){let n=y.tabs.find(t=>t.id===e);n&&(n.groupId=t,N(y.tabs),R(y.tabs,y.activeTabId))}function Ke(e){let t=y.tabs.find(t=>t.id===e);t&&(t.groupId=null,N(y.tabs),R(y.tabs,y.activeTabId))}function qe(e){return F.find(t=>t.name===e)||F[0]}y.tabGroups=ze();function L(e,t,n){return e===void 0&&(e=``),t===void 0&&(t=null),n===void 0&&(n=`split`),{id:`tab_`+Date.now()+`_`+Math.random().toString(36).substring(2,8),title:t||`Untitled`,content:e,scrollPos:0,viewMode:n,createdAt:Date.now()}}function R(e,t){let n=document.getElementById(`tab-list`);if(!n)return;n.replaceChildren();function r(e){let t=`<div class="tab-group-submenu">`;return t+=`<button class="tab-menu-item" data-action="new-group"><i class="bi bi-folder-plus"></i> New Group</button>`,y.tabGroups.length>0&&(t+=`<div class="tab-ctx-divider"></div>`,y.tabGroups.forEach(n=>{let r=qe(n.color),i=e===n.id?` ✓`:``;t+=`<button class="tab-menu-item" data-action="add-to-group" data-group-id="`+n.id+`"><span class="group-color-dot" style="background:`+r.dot+`"></span> `+(n.name||`Unnamed`)+i+`</button>`})),e&&(t+=`<div class="tab-ctx-divider"></div>`,t+=`<button class="tab-menu-item" data-action="remove-from-group"><i class="bi bi-folder-minus"></i> Remove from Group</button>`),t+=`</div>`,t}function i(e,n){let i=document.createElement(`div`);i.className=`tab-item`+(e.id===t?` active`:``),n&&(i.style.borderBottomColor=n.border,i.classList.add(`in-group`)),i.setAttribute(`data-tab-id`,e.id),i.setAttribute(`role`,`tab`),i.setAttribute(`aria-selected`,e.id===t?`true`:`false`),i.setAttribute(`draggable`,`true`);let a=document.createElement(`span`);a.className=`tab-title`,a.textContent=e.title||`Untitled`,a.ondblclick=n=>{n.stopPropagation(),startInlineRename(a,e.title||`Untitled`,async n=>{n&&n!==e.title?(y.localVaultMode&&e.handle&&(e.id.split(`/`).pop(),e.handle,e.id,y.vaultDirHandle),e.title=n,N(y.tabs),R(y.tabs,t)):R(y.tabs,t)})},a.title=e.title||`Untitled`;let o=document.createElement(`button`);o.className=`tab-menu-btn`,o.setAttribute(`aria-label`,`File options`),o.title=`File options`,o.textContent=`⋯`;let s=document.createElement(`div`);s.className=`tab-menu-dropdown`,s.replaceChildren(),s.insertAdjacentHTML(`beforeend`,`<button class="tab-menu-item" data-action="pin"><i class="bi bi-pin"></i> <span class="pin-label">`+(e.pinned?`Unpin`:`Pin`)+`</span></button><button class="tab-menu-item" data-action="tag"><i class="bi bi-tag"></i> Tag</button><button class="tab-menu-item tab-menu-item-has-sub" data-action="group-menu"><i class="bi bi-collection"></i> Group <i class="bi bi-chevron-right" style="font-size:10px;margin-left:auto"></i></button><div class="tab-ctx-divider"></div><button class="tab-menu-item" data-action="rename"><i class="bi bi-pencil"></i> Rename</button><button class="tab-menu-item" data-action="duplicate"><i class="bi bi-files"></i> Duplicate</button><button class="tab-menu-item tab-menu-item-danger" data-action="delete"><i class="bi bi-trash"></i> Delete</button>`);let c=document.createElement(`div`);c.className=`tab-group-sub-container`,c.style.display=`none`,c.replaceChildren(),c.insertAdjacentHTML(`beforeend`,r(e.groupId)),s.appendChild(c),o.appendChild(s);let l=s.querySelector(`[data-action="group-menu"]`);return l&&(l.addEventListener(`mouseenter`,()=>{c.style.display=`block`;let e=l.getBoundingClientRect();c.style.top=e.top+`px`,c.style.left=e.left-8+`px`}),l.addEventListener(`click`,e=>{e.stopPropagation(),c.style.display=c.style.display===`none`?`block`:`none`})),s.addEventListener(`mouseleave`,()=>{c.style.display=`none`}),c.querySelectorAll(`.tab-menu-item`).forEach(t=>{t.addEventListener(`click`,n=>{n.stopPropagation(),o.classList.remove(`open`);let r=t.dataset.action;if(r===`new-group`){let t=prompt(`Group name:`);if(t===null)return;let n=Be(t,`purple`);Ge(e.id,n.id)}else r===`add-to-group`?Ge(e.id,t.dataset.groupId):r===`remove-from-group`&&Ke(e.id)})}),o.addEventListener(`click`,function(e){if(e.stopPropagation(),document.querySelectorAll(`.tab-menu-btn.open`).forEach(function(e){e!==o&&e.classList.remove(`open`)}),o.classList.toggle(`open`),o.classList.contains(`open`)){var t=o.getBoundingClientRect();s.style.top=t.bottom+4+`px`,s.style.right=window.innerWidth-t.right+`px`,s.style.left=`auto`}}),s.querySelectorAll(`:scope > .tab-menu-item`).forEach(function(t){t.addEventListener(`click`,function(n){n.stopPropagation();let r=t.dataset.action;r!==`group-menu`&&(o.classList.remove(`open`),r===`rename`?Qe(e.id):r===`duplicate`?$e(e.id):r===`delete`?Ze(e.id):r===`pin`?tt(e.id):r===`tag`&&promptTagTab(e.id))})}),i.appendChild(a),i.appendChild(o),i.addEventListener(`click`,function(){B(e.id)}),i.addEventListener(`dragstart`,function(){draggedTabId=e.id,setTimeout(function(){i.classList.add(`dragging`)},0)}),i.addEventListener(`dragend`,function(){i.classList.remove(`dragging`),draggedTabId=null}),i.addEventListener(`dragover`,function(e){e.preventDefault(),i.classList.add(`drag-over`)}),i.addEventListener(`dragleave`,function(){i.classList.remove(`drag-over`)}),i.addEventListener(`drop`,function(t){if(t.preventDefault(),i.classList.remove(`drag-over`),!draggedTabId||draggedTabId===e.id)return;let n=y.tabs.findIndex(e=>e.id===draggedTabId),r=y.tabs.findIndex(t=>t.id===e.id);if(n===-1||r===-1)return;let a=y.tabs.splice(n,1)[0];e.groupId&&(a.groupId=e.groupId),y.tabs.splice(r,0,a),N(y.tabs),R(y.tabs,y.activeTabId)}),i}function a(e){let t=qe(e.color),n=document.createElement(`div`);return n.className=`tab-group-header`+(e.collapsed?` collapsed`:``),n.style.setProperty(`--group-color`,t.border),n.style.setProperty(`--group-bg`,t.bg),n.setAttribute(`data-group-id`,e.id),n.replaceChildren(),n.insertAdjacentHTML(`beforeend`,`<span class="group-color-dot" style="background:`+t.dot+`"></span><span class="group-header-name">`+(e.name||`Unnamed`)+`</span><span class="group-collapse-icon"><i class="bi bi-chevron-`+(e.collapsed?`right`:`down`)+`"></i></span>`),n.addEventListener(`click`,t=>{t.stopPropagation(),Ue(e.id)}),n.addEventListener(`dblclick`,t=>{t.stopPropagation(),He(e.id)}),n.addEventListener(`contextmenu`,t=>{t.preventDefault(),t.stopPropagation(),document.querySelectorAll(`.group-context-menu`).forEach(e=>e.remove());let n=document.createElement(`div`);n.className=`group-context-menu`,n.replaceChildren(),n.insertAdjacentHTML(`beforeend`,`<button data-action="rename"><i class="bi bi-pencil"></i> Rename</button><div class="tab-ctx-divider"></div><div class="group-color-picker">`+F.map(t=>`<span class="group-color-option`+(t.name===e.color?` active`:``)+`" data-color="`+t.name+`" style="background:`+t.dot+`"></span>`).join(``)+`</div><div class="tab-ctx-divider"></div><button class="tab-menu-item-danger" data-action="ungroup"><i class="bi bi-folder-minus"></i> Ungroup All</button><button class="tab-menu-item-danger" data-action="delete-group"><i class="bi bi-trash"></i> Delete Group</button>`),n.style.position=`fixed`,n.style.top=t.clientY+`px`,n.style.left=t.clientX+`px`,document.body.appendChild(n),n.querySelectorAll(`button`).forEach(t=>{t.addEventListener(`click`,r=>{r.stopPropagation(),n.remove();let i=t.dataset.action;i===`rename`?He(e.id):i===`ungroup`?Ve(e.id):i===`delete-group`&&(y.tabs.filter(t=>t.groupId===e.id).forEach(e=>Ze(e.id)),y.tabGroups=y.tabGroups.filter(t=>t.id!==e.id),I(),R(y.tabs,y.activeTabId))})}),n.querySelectorAll(`.group-color-option`).forEach(t=>{t.addEventListener(`click`,r=>{r.stopPropagation(),n.remove(),We(e.id,t.dataset.color)})});let r=()=>{n.remove(),document.removeEventListener(`click`,r)};setTimeout(()=>document.addEventListener(`click`,r),0)}),n.addEventListener(`dragover`,e=>{e.preventDefault(),n.classList.add(`drag-over`)}),n.addEventListener(`dragleave`,()=>{n.classList.remove(`drag-over`)}),n.addEventListener(`drop`,t=>{t.preventDefault(),n.classList.remove(`drag-over`),draggedTabId&&Ge(draggedTabId,e.id)}),n}y.tabGroups.forEach(t=>{let r=e.filter(e=>e.groupId===t.id);if(r.length===0)return;let o=qe(t.color);n.appendChild(a(t)),t.collapsed||r.forEach(e=>{n.appendChild(i(e,o))})}),e.filter(e=>!e.groupId||!y.tabGroups.some(t=>t.id===e.groupId)).forEach(e=>{n.appendChild(i(e,null))});let o=document.createElement(`button`);o.className=`tab-new-btn`,o.title=`New Tab (Ctrl+T)`,o.setAttribute(`aria-label`,`Open new tab`),o.replaceChildren();let s=document.createElement(`i`);s.className=`bi bi-plus-lg`,o.appendChild(s),o.addEventListener(`click`,function(){Ye()}),n.appendChild(o);let c=n.querySelector(`.tab-item.active`);c&&c.scrollIntoView({block:`nearest`,inline:`nearest`}),Je(e,t)}function Je(e,t){let n=document.getElementById(`mobile-tab-list`);n&&(n.replaceChildren(),e.forEach(function(e){let r=document.createElement(`div`);r.className=`mobile-tab-item`+(e.id===t?` active`:``),r.setAttribute(`role`,`tab`),r.setAttribute(`aria-selected`,e.id===t?`true`:`false`),r.setAttribute(`data-tab-id`,e.id);let i=document.createElement(`span`);i.className=`mobile-tab-title`,i.textContent=e.title||`Untitled`,i.title=e.title||`Untitled`;let a=document.createElement(`button`);a.className=`tab-menu-btn`,a.setAttribute(`aria-label`,`File options`),a.title=`File options`,a.textContent=`⋯`;let o=document.createElement(`div`);o.className=`tab-menu-dropdown`,o.replaceChildren(),o.insertAdjacentHTML(`beforeend`,`<button class="tab-menu-item" data-action="rename"><i class="bi bi-pencil"></i> Rename</button><button class="tab-menu-item" data-action="duplicate"><i class="bi bi-files"></i> Duplicate</button><button class="tab-menu-item tab-menu-item-danger" data-action="delete"><i class="bi bi-trash"></i> Delete</button>`),a.appendChild(o),a.addEventListener(`click`,function(e){if(e.stopPropagation(),document.querySelectorAll(`.tab-menu-btn.open`).forEach(function(e){e!==a&&e.classList.remove(`open`)}),a.classList.toggle(`open`),a.classList.contains(`open`)){let e=a.getBoundingClientRect();o.style.top=e.bottom+4+`px`,o.style.right=window.innerWidth-e.right+`px`,o.style.left=`auto`}}),o.querySelectorAll(`.tab-menu-item`).forEach(function(t){t.addEventListener(`click`,function(n){n.stopPropagation(),a.classList.remove(`open`);let r=t.getAttribute(`data-action`);r===`rename`?(closeMobileMenu(),Qe(e.id)):r===`duplicate`?($e(e.id),closeMobileMenu()):r===`delete`&&Ze(e.id)})}),r.appendChild(i),r.appendChild(a),r.addEventListener(`click`,function(){B(e.id),closeMobileMenu()}),n.appendChild(r)}))}document.addEventListener(`click`,function(){document.querySelectorAll(`.tab-menu-btn.open`).forEach(function(e){e.classList.remove(`open`)})});async function z(e=!1){let t=y.tabs.find(function(e){return e.id===y.activeTabId});if(t)if(t.content=n.value,t.scrollPos=n.scrollTop,t.viewMode=T||`split`,t.handle&&e===!0)try{let e=await t.handle.createWritable();if(await e.write(t.content),await e.close(),y.vaultMiniSearch)try{let e={id:t.id,title:t.title,path:t.path,content:t.content};y.vaultMiniSearch.has(t.id)?y.vaultMiniSearch.replace(e):y.vaultMiniSearch.add(e)}catch(e){console.warn(`MiniSearch update error:`,e)}}catch(e){console.error(`Failed to write cleanly to vault:`,e)}else t.handle||N(y.tabs)}async function B(e){if(e===y.activeTabId&&!y.localVaultMode)return;await z(!0),y.activeTabId=e,P(y.activeTabId);let t=y.tabs.find(function(t){return t.id===e});if(t){if(t.handle&&!t.content)try{t.content=await(await t.handle.getFile()).text()}catch{t.content=`Error reading file`}n.value=t.content||``,A(t.viewMode),W(),requestAnimationFrame(function(){n.scrollTop=t.scrollPos||0}),R(y.tabs,y.activeTabId)}}function Ye(e,t){e===void 0&&(e=``),t||=Re();let r=L(e,t);r.createdAt=Date.now(),y.tabs.push(r),B(r.id),n.focus()}function Xe(e){let t=y.tabs.findIndex(function(t){return t.id===e});if(t!==-1){if(y.tabs.splice(t,1),y.tabs.length===0){let e=L(``,Re());y.tabs.push(e),y.activeTabId=e.id,P(y.activeTabId),n.value=``,A(`split`),W()}else if(y.activeTabId===e){let e=Math.max(0,t-1);y.activeTabId=y.tabs[e].id,P(y.activeTabId);let r=y.tabs[e];n.value=r.content,A(r.viewMode),W(),requestAnimationFrame(function(){n.scrollTop=r.scrollPos||0})}N(y.tabs),R(y.tabs,y.activeTabId)}}function Ze(e){Xe(e)}function Qe(e){let t=y.tabs.find(function(t){return t.id===e});if(!t)return;let n=document.getElementById(`rename-modal`),r=document.getElementById(`rename-modal-input`),i=document.getElementById(`rename-modal-confirm`),a=document.getElementById(`rename-modal-cancel`);if(!n||!r)return;r.value=t.title,n.style.display=`flex`,r.focus(),r.select();function o(){let e=r.value.trim();e&&(t.title=e,N(y.tabs),R(y.tabs,y.activeTabId)),n.style.display=`none`,s()}function s(){i.removeEventListener(`click`,o),a.removeEventListener(`click`,c),r.removeEventListener(`keydown`,l)}function c(){n.style.display=`none`,s()}function l(e){e.key===`Enter`?o():e.key===`Escape`&&c()}i.addEventListener(`click`,o),a.addEventListener(`click`,c),r.addEventListener(`keydown`,l)}function $e(e){let t=y.tabs.find(function(t){return t.id===e});if(!t)return;z(!0);let n=t.title+` (copy)`,r=L(t.content,n,t.viewMode);t.groupId&&(r.groupId=t.groupId);let i=y.tabs.findIndex(function(t){return t.id===e});y.tabs.splice(i+1,0,r),B(r.id)}function et(){let e=document.getElementById(`reset-confirm-modal`),t=document.getElementById(`reset-modal-confirm`),r=document.getElementById(`reset-modal-cancel`),i=document.getElementById(`reset-modal-title`);if(!e)return;y.localVaultMode?(i.textContent=`Close all AppState.tabs? (Local files will NOT be deleted)`,t.textContent=`Close All`):(i.textContent=`Are you sure you want to delete all virtual files and reset to default?`,t.textContent=`Delete & Reset`),e.style.display=`flex`;function a(){if(e.style.display=`none`,s(),y.tabs=[],y.tabGroups=[],I(),y.untitledCounter=0,Le(0),y.localVaultMode)y.activeTabId=null,n.value=``;else{let e=L(j,`Welcome to Markdown`);if(y.tabs.push(e),M!==void 0){let e=Be(`demo`,`purple`),t=L(M,`30 chart`);t.groupId=e.id,y.tabs.push(t)}y.activeTabId=e.id,n.value=j}P(y.activeTabId),N(y.tabs),A(`split`),W(),R(y.tabs,y.activeTabId),window.history&&window.history.replaceState?window.history.replaceState(null,null,window.location.pathname):window.location.hash=``}function o(){e.style.display=`none`,s()}function s(){t.removeEventListener(`click`,a),r.removeEventListener(`click`,o)}t.addEventListener(`click`,a),r.addEventListener(`click`,o)}function tt(e){let t=y.tabs.find(t=>t.id===e);t&&(t.pinned=!t.pinned,N(y.tabs),R(y.tabs,y.activeTabId))}function nt(){let e=document.getElementById(`mobile-menu-panel`),t=document.getElementById(`mobile-menu-overlay`),n=document.getElementById(`mobile-menu-toggle`),r=document.getElementById(`mobile-close-menu`),i=document.getElementById(`mobile-toggle-vault`),a=document.getElementById(`mobile-toggle-sync`),o=document.getElementById(`mobile-import-btn`),s=document.getElementById(`mobile-export-md`),c=document.getElementById(`mobile-export-html`),l=document.getElementById(`mobile-export-pdf`),u=document.getElementById(`mobile-copy-markdown`),d=document.getElementById(`mobile-theme-toggle`),f=document.getElementById(`mobile-new-tab-btn`),p=document.getElementById(`mobile-tab-reset-btn`),m=document.querySelectorAll(`.mobile-view-mode-btn`),h=document.getElementById(`theme-toggle`),g=document.getElementById(`file-input`),ee=document.getElementById(`export-md`),_=document.getElementById(`export-html`),v=document.getElementById(`export-pdf`),y=document.getElementById(`copy-markdown-button`);function te(){e&&e.classList.add(`active`),t&&t.classList.add(`active`)}function b(){e&&e.classList.remove(`active`),t&&t.classList.remove(`active`)}n&&n.addEventListener(`click`,te),r&&r.addEventListener(`click`,b),t&&t.addEventListener(`click`,b),i&&i.addEventListener(`click`,()=>{let e=document.getElementById(`sidebar-explorer`);e&&e.classList.toggle(`mobile-active`),b()}),a&&a.addEventListener(`click`,()=>{Ce(),w?(a.innerHTML=`<i class="bi bi-link me-2"></i> On`,a.classList.add(`sync-enabled`),a.classList.remove(`sync-disabled`,`border-primary`)):(a.innerHTML=`<i class="bi bi-link-45deg me-2"></i> Off`,a.classList.add(`sync-disabled`,`border-primary`),a.classList.remove(`sync-enabled`))}),o&&g&&o.addEventListener(`click`,()=>g.click()),s&&ee&&s.addEventListener(`click`,()=>ee.click()),c&&_&&c.addEventListener(`click`,()=>_.click()),l&&v&&l.addEventListener(`click`,()=>v.click()),u&&y&&u.addEventListener(`click`,()=>y.click()),d&&h&&d.addEventListener(`click`,()=>{h.click(),d.innerHTML=h.innerHTML+` Toggle Dark Mode`}),f&&f.addEventListener(`click`,function(){Ye(),b()}),p&&p.addEventListener(`click`,function(){b(),et()}),m&&m.forEach(e=>{e.addEventListener(`click`,function(){k(this.getAttribute(`data-mode`)),z(),b()})})}function rt(){let e=document.getElementById(`mobile-char-count`),t=document.getElementById(`mobile-word-count`),n=document.getElementById(`mobile-reading-time`);e&&l&&(e.textContent=l.textContent),t&&c&&(t.textContent=c.textContent),n&&s&&(n.textContent=s.textContent)}function it(e){let t=document.createTreeWalker(e,NodeFilter.SHOW_TEXT,null,!1),n=[],r;for(;r=t.nextNode();){let t=r.parentNode,i=!1;for(;t&&t!==e;){if(t.tagName===`PRE`||t.tagName===`CODE`){i=!0;break}t=t.parentNode}!i&&r.nodeValue.includes(`:`)&&n.push(r)}n.forEach(e=>{let t=e.nodeValue,n=/:([\w+-]+):/g,r,i=0,a=``,o=!1;for(;(r=n.exec(t))!==null;){let e=r[1],s=joypixels.shortnameToUnicode(`:${e}:`);s===`:${e}:`?(a+=t.substring(i,n.lastIndex),i=n.lastIndex):(o=!0,a+=t.substring(i,r.index)+s,i=n.lastIndex)}if(o){a+=t.substring(i);let n=document.createElement(`span`);n.innerHTML=a,e.parentNode.replaceChild(n,e)}})}function at(e){let t=e.cloneNode(!0),n=e.getBoundingClientRect();t.getAttribute(`width`)||t.setAttribute(`width`,Math.round(n.width)),t.getAttribute(`height`)||t.setAttribute(`height`,Math.round(n.height));let r=new XMLSerializer().serializeToString(t);return`data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(r)))}`}function ot(e){return new Promise((t,n)=>{let r=document.createElement(`canvas`),i=r.getContext(`2d`),a=e.getBoundingClientRect(),o=window.devicePixelRatio||2,s=Math.round(a.width),c=Math.round(a.height);r.width=s*o,r.height=c*o,i.scale(o,o),i.fillStyle=getComputedStyle(document.documentElement).getPropertyValue(`--bg-color`).trim()||`#ffffff`,i.fillRect(0,0,s,c);let l=new Image;l.onload=()=>{i.drawImage(l,0,0,s,c),t(r)},l.onerror=n,l.src=at(e)})}async function st(e,t){let n=e.querySelector(`svg`);if(!n)return;let r=t.innerHTML;t.innerHTML=`<i class="bi bi-hourglass-split"></i>`;try{(await ot(n)).toBlob(e=>{let n=URL.createObjectURL(e),i=document.createElement(`a`);i.href=n,i.download=`diagram-${Date.now()}.png`,i.click(),URL.revokeObjectURL(n),t.innerHTML=`<i class="bi bi-check-lg"></i>`,setTimeout(()=>{t.innerHTML=r},1500)},`image/png`)}catch(e){console.error(`Mermaid PNG export failed:`,e),t.innerHTML=r}}async function ct(e,t){let n=e.querySelector(`svg`);if(!n)return;let r=t.innerHTML;t.innerHTML=`<i class="bi bi-hourglass-split"></i>`;try{(await ot(n)).toBlob(async e=>{try{await navigator.clipboard.write([new ClipboardItem({"image/png":e})]),t.innerHTML=`<i class="bi bi-check-lg"></i> Copied!`}catch(e){console.error(`Clipboard write failed:`,e),t.innerHTML=`<i class="bi bi-x-lg"></i>`}setTimeout(()=>{t.innerHTML=r},1800)},`image/png`)}catch(e){console.error(`Mermaid copy failed:`,e),t.innerHTML=r}}function lt(e,t){let n=e.querySelector(`svg`);if(!n)return;let r=n.cloneNode(!0),i=new XMLSerializer().serializeToString(r),a=new Blob([i],{type:`image/svg+xml`}),o=URL.createObjectURL(a),s=document.createElement(`a`);s.href=o,s.download=`diagram-${Date.now()}.svg`,s.click(),URL.revokeObjectURL(o);let c=t.innerHTML;t.innerHTML=`<i class="bi bi-check-lg"></i>`,setTimeout(()=>{t.innerHTML=c},1500)}var V=null,H=null;function ut(){let e=document.getElementById(`mermaid-zoom-modal`),t=document.getElementById(`mermaid-modal-diagram`);if(!e.classList.contains(`active`))return;e.classList.remove(`active`),H&&=(H.dispose(),null),t.innerHTML=``,V=null;let n=document.querySelector(`.mermaid-modal-content`);n&&n.classList.remove(`fullscreen`);let r=document.getElementById(`mermaid-modal-fullscreen`);r&&(r.innerHTML=`<i class="bi bi-arrows-fullscreen"></i> Fullscreen`)}function dt(e){let t=e.querySelector(`svg`);if(!t)return;let n=document.getElementById(`mermaid-zoom-modal`),r=document.getElementById(`mermaid-modal-diagram`);H&&=(H.dispose(),null),r.innerHTML=``;let i=t.cloneNode(!0);i.removeAttribute(`width`),i.removeAttribute(`height`),i.style.width=`auto`,i.style.height=`auto`,i.style.maxWidth=`100%`,i.style.maxHeight=`100%`,r.appendChild(i),V=i,n.classList.add(`active`),setTimeout(()=>{H=window.panzoom(i,{maxZoom:10,minZoom:.1,smoothScroll:!0,zoomDoubleClickSpeed:1,bounds:!1})},50)}function ft(){let e=document.getElementById(`mermaid-zoom-modal`);document.getElementById(`mermaid-modal-close`).addEventListener(`click`,ut),e.addEventListener(`click`,function(t){t.target===e&&ut()}),document.getElementById(`mermaid-modal-zoom-in`).addEventListener(`click`,()=>{if(H){let e=H.getTransform();H.smoothZoom(e.x,e.y,1.5)}}),document.getElementById(`mermaid-modal-zoom-out`).addEventListener(`click`,()=>{if(H){let e=H.getTransform();H.smoothZoom(e.x,e.y,.7)}}),document.getElementById(`mermaid-modal-zoom-reset`).addEventListener(`click`,()=>{H&&(H.moveTo(0,0),H.zoomAbs(0,0,1))});let t=document.getElementById(`mermaid-modal-fullscreen`);t&&t.addEventListener(`click`,function(){let e=document.querySelector(`.mermaid-modal-content`);e.classList.toggle(`fullscreen`);let t=e.classList.contains(`fullscreen`);this.innerHTML=t?`<i class="bi bi-fullscreen-exit"></i> Exit`:`<i class="bi bi-arrows-fullscreen"></i> Fullscreen`}),document.getElementById(`mermaid-modal-download-png`).addEventListener(`click`,async function(){if(!V)return;let e=this,t=e.innerHTML;e.innerHTML=`<i class="bi bi-hourglass-split"></i>`;try{(await ot(V)).toBlob(n=>{let r=URL.createObjectURL(n),i=document.createElement(`a`);i.href=r,i.download=`diagram-${Date.now()}.png`,i.click(),URL.revokeObjectURL(r),e.innerHTML=`<i class="bi bi-check-lg"></i>`,setTimeout(()=>{e.innerHTML=t},1500)},`image/png`)}catch(n){console.error(`Modal PNG export failed:`,n),e.innerHTML=t}}),document.getElementById(`mermaid-modal-copy`).addEventListener(`click`,async function(){if(!V)return;let e=this,t=e.innerHTML;e.innerHTML=`<i class="bi bi-hourglass-split"></i>`;try{(await ot(V)).toBlob(async n=>{try{await navigator.clipboard.write([new ClipboardItem({"image/png":n})]),e.innerHTML=`<i class="bi bi-check-lg"></i> Copied!`}catch(t){console.error(`Clipboard write failed:`,t),e.innerHTML=`<i class="bi bi-x-lg"></i>`}setTimeout(()=>{e.innerHTML=t},1800)},`image/png`)}catch(n){console.error(`Modal copy failed:`,n),e.innerHTML=t}}),document.getElementById(`mermaid-modal-download-svg`).addEventListener(`click`,function(){if(!V)return;let e=new XMLSerializer().serializeToString(V),t=new Blob([e],{type:`image/svg+xml`}),n=URL.createObjectURL(t),r=document.createElement(`a`);r.href=n,r.download=`diagram-${Date.now()}.svg`,r.click(),URL.revokeObjectURL(n)})}function pt(){let e=document.getElementById(`mermaid-zoom-modal`);document.getElementById(`markdown-preview`).querySelectorAll(`.mermaid-container`).forEach(t=>{if(t.querySelector(`.mermaid-toolbar`)||!t.querySelector(`svg`))return;let n=document.createElement(`div`);n.className=`mermaid-toolbar`,n.setAttribute(`aria-label`,`Diagram actions`);let r=document.createElement(`button`);r.className=`mermaid-toolbar-btn`,r.title=`Zoom diagram`,r.setAttribute(`aria-label`,`Zoom diagram`),r.innerHTML=`<i class="bi bi-arrows-fullscreen"></i>`,r.addEventListener(`click`,()=>dt(t));let i=document.createElement(`button`);i.className=`mermaid-toolbar-btn`,i.title=`Download PNG`,i.setAttribute(`aria-label`,`Download PNG`),i.innerHTML=`<i class="bi bi-file-image"></i> PNG`,i.addEventListener(`click`,()=>st(t,i));let a=document.createElement(`button`);a.className=`mermaid-toolbar-btn`,a.title=`Copy image to clipboard`,a.setAttribute(`aria-label`,`Copy image to clipboard`),a.innerHTML=`<i class="bi bi-clipboard-image"></i> Copy`,a.addEventListener(`click`,()=>ct(t,a));let o=document.createElement(`button`);o.className=`mermaid-toolbar-btn`,o.title=`Download SVG`,o.setAttribute(`aria-label`,`Download SVG`),o.innerHTML=`<i class="bi bi-filetype-svg"></i> SVG`,o.addEventListener(`click`,()=>lt(t,o)),n.appendChild(r),n.appendChild(a),n.appendChild(i),n.appendChild(o),t.appendChild(n),t.addEventListener(`dblclick`,n=>{n.target.closest(`.mermaid-toolbar`)||(e.classList.contains(`active`)?ut():dt(t))})})}function mt(){let e=document.documentElement.getAttribute(`data-theme`)===`dark`?`dark`:`default`;mermaid.initialize({startOnLoad:!1,theme:e,securityLevel:`loose`,flowchart:{useMaxWidth:!0,htmlLabels:!0},fontSize:16})}function ht(){try{mt()}catch(e){console.warn(`Mermaid initialization failed:`,e)}let e={gfm:!0,breaks:!1,pedantic:!1,sanitize:!1,smartypants:!1,xhtml:!1,headerIds:!0,mangle:!1},t=new marked.Renderer;t.code=function(e,t){if(t===`mermaid`){let t=`mermaid-diagram-`+Math.random().toString(36).substr(2,9),n=e;return/^\s*(flowchart|graph)\b/i.test(e)&&(n=e.replace(/(\b\d+\.)\s+/g,`$1&nbsp;`).replace(/(^|[\[\(|]\s*)([-*+])\s+/g,`$1$2&nbsp;`)),`<div class="mermaid-container"><pre class="mermaid" id="${t}">${(e=>e.replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`).replace(/"/g,`&quot;`).replace(/'/g,`&#039;`))(n)}</pre></div>`}if((t===`plantuml`||t===`puml`)&&window.plantumlEncoder)return`<div class="plantuml-container" style="text-align: center; margin: 1.5em 0;">
                <img src="https://www.plantuml.com/plantuml/svg/${window.plantumlEncoder.encode(e)}" alt="PlantUML Diagram" style="max-width: 100%; height: auto; border-radius: 4px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);" />
              </div>`;if(t===`drawio`)return`<div class="mxgraph-container" style="text-align: center; margin: 1.5em 0;">
              <div class="mxgraph" style="max-width:100%;border:1px solid var(--border-color);border-radius:6px;background:var(--preview-bg);" data-mxgraph="${`{"highlight":"#0366d6","nav":true,"resize":true,"toolbar":"zoom layers tags lightbox","edit":"_blank","xml":"${e.replace(/"/g,`&quot;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`)}"}`}"></div>
            </div>`;let n=hljs.getLanguage(t)?t:`plaintext`;return`<pre><code class="hljs ${n}">${hljs.highlight(e,{language:n}).value}</code></pre>`},t.link=function(e,t,n){let r=marked.Renderer.prototype.link.call(this,e,t,n);return e&&!e.startsWith(`#`)?r.replace(`<a `,`<a target="_blank" rel="noopener noreferrer" `):r},marked.setOptions({...e,renderer:t});let n=marked.parse;marked.parse=function(e,t){try{let r=e.split(`
`),i=[],a=!1,o=!1,s=/^(flowchart|sequenceDiagram|classDiagram|stateDiagram|stateDiagram-v2|erDiagram|journey|gantt|pie|gitGraph|mindmap|timeline|graph|architecture-beta|architecture|sankey-beta|xychart-beta|block-beta|packet-beta|ishikawa|quadrantChart|requirementDiagram|C4Context|C4Container|C4Component|C4Dynamic|C4Deployment)\b/i,c=e=>{let t=e.trim();return!!(!t||/^[ \t]/.test(e)||/^(subgraph|end|click|style|class|classDef|linkStyle|direction|note|participant|actor|activate|deactivate|group|service|title|x-axis|y-axis|quadrant-\d|requirement|functionalRequirement|performanceRequirement|interfaceRequirement|designConstraint|element|contains|copies|derives|satisfies|verifies|refines|traces|columns|space|Person|Person_Ext|System|System_Ext|SystemDb|SystemQueue|Container|Container_Ext|ContainerDb|ContainerQueue|ContainerExt|Component|Component_Ext|ComponentDb|ComponentQueue|Rel|Rel_U|Rel_D|Rel_L|Rel_R|Rel_Back|BiRel|Boundary|Enterprise_Boundary|System_Boundary|Container_Boundary|UpdateElementStyle|UpdateRelStyle|UpdateLayoutConfig)\b/i.test(t)||/[-\=]+\>/.test(t)||t.includes(`---`)||t.includes(`===`)||/\[.*\]|\(.*\)|{.*}|>.*\]/.test(t)||t.includes(`:`)||/^"[^"]+"\s*:\s*\[/.test(t)||/^[A-Za-z0-9_]+$/.test(t)||t.split(`,`).length>=3&&!isNaN(parseFloat(t.split(`,`).pop())))};for(let e=0;e<r.length;e++){let t=r[e];if(t.trim().startsWith("```")){o=!o,i.push(t);continue}if(!o&&!a&&s.test(t.trim())){a=!0,i.push("```mermaid"),i.push(t);continue}if(a){if(/^(#{1,6}\s|\-\-\-|> \s|\*\s|\-\s|\d+\.\s)/.test(t)){i.push("```"),a=!1,i.push(t);continue}if(e>0&&r[e-1].trim()===``&&t.trim()!==``&&!c(t)){i.push("```"),a=!1,i.push(t);continue}}i.push(t)}return a&&i.push("```"),n(i.join(`
`),t)}catch(r){return console.warn(`Markdown parsing error, fallback to original parser:`,r),n(e,t)}}}var gt=t({debouncedRender:()=>bt,renderMarkdown:()=>W,updateDocumentStats:()=>xt,updateTOC:()=>yt}),U=document.getElementById(`markdown-preview`),_t=null,vt=150;function W(){try{let e=n.value,t=marked.parse(e);U.innerHTML=DOMPurify.sanitize(t,{ADD_TAGS:[`mjx-container`],ADD_ATTR:[`id`,`class`,`style`,`data-mxgraph`]}),it(U),mt();try{let e=U.querySelectorAll(`.mermaid`);e.length>0&&(e.forEach(e=>{e.innerHTML.includes(`\\n`)&&(e.innerHTML=e.innerHTML.replace(/\\n/g,`<br/>`))}),mermaid.run({nodes:Array.from(e),suppressErrors:!0}).then(()=>pt()).catch(e=>{console.warn(`Mermaid rendering failed:`,e),pt()}))}catch(e){console.warn(`Mermaid rendering failed:`,e)}if(window.MathJax)try{typeof MathJax.typesetPromise==`function`?MathJax.typesetPromise([U]).catch(e=>{console.warn(`MathJax typesetting failed:`,e)}):MathJax.startup&&MathJax.startup.promise&&MathJax.startup.promise.then(()=>{typeof MathJax.typesetPromise==`function`&&MathJax.typesetPromise([U]).catch(e=>{console.warn(`MathJax typesetting failed:`,e)})})}catch(e){console.warn(`MathJax rendering failed:`,e)}if(window.GraphViewer)try{window.GraphViewer.processElements()}catch(e){console.warn(`Draw.io GraphViewer rendering failed:`,e)}xt(),rt(),yt()}catch(e){console.error(`Markdown rendering failed:`,e),U.innerHTML=`<div class="alert alert-danger">
              <strong>Error rendering markdown:</strong> ${e.message}
          </div>
          <pre>${n.value}</pre>`}}function yt(){let e=document.getElementById(`toc-tree`);if(!e)return;let t=U.querySelectorAll(`h1, h2, h3, h4, h5, h6`);if(t.length===0){e.innerHTML=`<div class="empty-vault-message">No headings found in document.</div>`;return}e.innerHTML=``,t.forEach((t,n)=>{t.id||=t.textContent.toLowerCase().replace(/[^a-z0-9]+/g,`-`).replace(/(^-|-$)+/g,``)||`heading-`+n;let r=parseInt(t.tagName.substring(1)),i=document.createElement(`div`);i.className=`tree-node`,i.style.paddingLeft=`${(r-1)*16+16}px`,r===1?i.style.fontWeight=`600`:r>2&&(i.style.opacity=`0.8`,i.style.fontSize=`0.85rem`),i.innerHTML=`<div class="tree-node-title" title="${t.textContent}">${t.textContent}</div>`,i.addEventListener(`click`,()=>{t.scrollIntoView({behavior:`smooth`})}),e.appendChild(i)})}function bt(){clearTimeout(_t),_t=setTimeout(W,vt)}function xt(){let e=n.value,t=e.length;l&&(l.textContent=t.toLocaleString());let r=e.trim()===``?0:e.trim().split(/\s+/).length;c&&(c.textContent=r.toLocaleString());let i=Math.ceil(r/200);s&&(s.textContent=i)}function St(){let e=window.matchMedia&&window.matchMedia(`(prefers-color-scheme: dark)`).matches;if(document.documentElement.setAttribute(`data-theme`,e?`dark`:`light`),r){r.textContent=``;let t=document.createElement(`i`);t.className=e?`bi bi-sun`:`bi bi-moon`,r.appendChild(t),r.addEventListener(`click`,function(){let e=document.documentElement.getAttribute(`data-theme`)===`dark`?`light`:`dark`;document.documentElement.setAttribute(`data-theme`,e),e===`dark`?r.innerHTML=`<i class="bi bi-sun"></i>`:r.innerHTML=`<i class="bi bi-moon"></i>`,W()})}let t=document.querySelectorAll(`.doc-theme-select`),n=document.getElementById(`markdown-preview`);t.length>0&&n&&t.forEach(e=>{e.addEventListener(`click`,r=>{r.preventDefault(),t.forEach(e=>e.classList.remove(`active`)),e.classList.add(`active`);let i=e.getAttribute(`data-theme`);n.className.split(` `).forEach(e=>{e.startsWith(`theme-`)&&n.classList.remove(e)}),i!==`default`&&n.classList.add(`theme-${i}`)})})}function Ct(){let e=document.getElementById(`privacy-notice`),t=document.getElementById(`privacy-dismiss`);e&&!localStorage.getItem(`kido-privacy-dismissed`)&&(e.style.display=`block`),t&&t.addEventListener(`click`,()=>{e.classList.add(`dismissing`),localStorage.setItem(`kido-privacy-dismissed`,`1`),setTimeout(()=>{e.style.display=`none`},300)})}var wt=[],Tt=document.getElementById(`history-btn`),G=document.getElementById(`history-panel`),K=document.getElementById(`history-overlay`),Et=document.getElementById(`history-close`),q=document.getElementById(`history-list`),Dt=document.getElementById(`history-diff-view`),Ot=document.getElementById(`history-diff-content`),kt=document.getElementById(`history-diff-title`),At=document.getElementById(`history-back`);async function jt(){try{let e=await localforage.getItem(v);wt=e?JSON.parse(e):[]}catch{wt=[]}}function Mt(){return wt}function Nt(e){wt=e,localforage.setItem(v,JSON.stringify(e)).catch(e=>console.warn(e))}function Pt(){return Date.now().toString(36)+Math.random().toString(36).slice(2,7)}function Ft(e,t){let n=Mt(),r=n.filter(e=>e.tabId===y.activeTabId),i=r.length>0?r[r.length-1]:null,a={id:Pt(),tabId:y.activeTabId,title:t||`Untitled`,content:e,timestamp:Date.now(),parentId:i?i.id:null};return n.push(a),n.length>200&&n.splice(0,n.length-200),Nt(n),a}function It(){if(!G)return;let e=Mt().filter(e=>!e.tabId||e.tabId===y.activeTabId);Dt.style.display=`none`,q.style.display=`block`;let t=y.tabs.find(e=>e.id===y.activeTabId),n=G.querySelector(`h3`);n&&(n.innerHTML=`<i class="bi bi-clock-history"></i> `+(t?t.title:`Version`)+` History`),e.length===0?q.innerHTML=`<div class="history-empty">No history for this note yet.<br>Share it to start tracking versions.</div>`:(q.innerHTML=e.slice().reverse().map(e=>{let t=new Date(e.timestamp).toLocaleString(),n=e.parentId?`<span class="has-parent"><i class="bi bi-git"></i> has parent</span>`:``,r=e.content?e.content.length+` chars`:``;return`<div class="history-item" data-id="`+e.id+`"><div class="history-item-title">`+(e.title||`Untitled`)+`</div><div class="history-item-meta"><span>`+t+`</span><span>`+r+`</span>`+n+`</div></div>`}).join(``),q.querySelectorAll(`.history-item`).forEach(e=>{e.addEventListener(`click`,()=>{let t=e.dataset.id;Rt(t)})})),G.style.display=`flex`,K.style.display=`block`}function Lt(){G&&(G.style.display=`none`),K&&(K.style.display=`none`)}function Rt(e){let t=Mt(),n=t.find(t=>t.id===e);if(!n)return;let r=n.parentId?t.find(e=>e.id===n.parentId):null;if(q.style.display=`none`,Dt.style.display=`flex`,!r){kt.textContent=`First version — `+(n.title||`Untitled`),Ot.innerHTML=n.content.split(`
`).map(e=>`<div class="diff-line diff-added">+ `+zt(e)+`</div>`).join(``);return}kt.textContent=`Changes from previous version`,typeof Diff<`u`&&Diff.diffLines?Ot.innerHTML=Diff.diffLines(r.content||``,n.content||``).map(e=>{let t=e.value.split(`
`).filter((e,t,n)=>t<n.length-1||e!==``),n=e.added?`diff-added`:e.removed?`diff-removed`:`diff-unchanged`,r=e.added?`+ `:e.removed?`- `:`  `;return t.map(e=>`<div class="diff-line `+n+`">`+r+zt(e)+`</div>`).join(``)}).join(``):Ot.innerHTML=`<div class="history-empty">Diff library not loaded</div>`}function zt(e){let t=document.createElement(`div`);return t.textContent=e,t.innerHTML}function Bt(){Tt&&Tt.addEventListener(`click`,It),Et&&Et.addEventListener(`click`,Lt),K&&K.addEventListener(`click`,Lt),At&&At.addEventListener(`click`,()=>{Dt.style.display=`none`,q.style.display=`block`});let e=document.getElementById(`history-resize-handle`);if(e&&G){let t=!1,n=0,r=0;e.addEventListener(`mousedown`,i=>{t=!0,n=i.clientX,r=G.offsetWidth,e.classList.add(`dragging`),document.body.style.cursor=`col-resize`,document.body.style.userSelect=`none`,i.preventDefault()}),document.addEventListener(`mousemove`,e=>{if(!t)return;let i=n-e.clientX,a=Math.min(Math.max(r+i,280),window.innerWidth*.8);G.style.width=a+`px`}),document.addEventListener(`mouseup`,()=>{t&&(t=!1,e.classList.remove(`dragging`),document.body.style.cursor=``,document.body.style.userSelect=``)})}}function Vt(){let e=null,t=null;n.addEventListener(`input`,function(){bt(),clearTimeout(t),t=setTimeout(z,500),clearTimeout(e),e=setTimeout(()=>{let e=n.value;if(!e.trim())return;let t=Mt().filter(e=>e.tabId===y.activeTabId),r=t.length>0?t[t.length-1]:null;if(!r||Math.abs(e.length-(r.content||``).length)>=20){let t=y.tabs.find(e=>e.id===y.activeTabId);Ft(e,t?t.title:`Untitled`)}},5e3)}),n.addEventListener(`keydown`,function(e){if(e.key===`Tab`){e.preventDefault();let t=this.selectionStart,n=this.selectionEnd,r=this.value;this.value=r.substring(0,t)+`  `+r.substring(n),this.selectionStart=this.selectionEnd=t+2,this.dispatchEvent(new Event(`input`))}})}var Ht=32e3;function Ut(e){let t=pako.deflate(new TextEncoder().encode(e)),n=32768,r=``;for(let e=0;e<t.length;e+=n)r+=String.fromCharCode.apply(null,t.subarray(e,e+n));return btoa(r).replace(/\+/g,`-`).replace(/\//g,`_`).replace(/=+$/,``)}function Wt(e){let t=decodeURIComponent(e).replace(/-/g,`+`).replace(/_/g,`/`);for(;t.length%4;)t+=`=`;let n=atob(t),r=Uint8Array.from(n,e=>e.charCodeAt(0));return new TextDecoder().decode(pako.inflate(r))}function Gt(e){let t=y.tabs.find(e=>e.id===y.activeTabId),r=t?t.title:`Untitled`;Ft(n.value,r);let i=n.value,a;try{a=Ut(i)}catch(e){console.error(`Share encoding failed:`,e),alert(`Failed to encode content for sharing: `+e.message);return}let o=window.location.origin+window.location.pathname+`#share=`+a+`&mode=`+T,s=o.length>Ht,c=e.innerHTML;function l(){s||(window.location.hash=`share=`+a+`&mode=`+T),e.innerHTML=`<i class="bi bi-check-lg"></i> Copied!`,setTimeout(()=>{e.innerHTML=c},2e3)}if(navigator.clipboard&&window.isSecureContext)navigator.clipboard.writeText(o).then(l).catch(()=>{});else try{let e=document.createElement(`textarea`);e.value=o,document.body.appendChild(e),e.select(),document.execCommand(`copy`),document.body.removeChild(e),l()}catch{}}function Kt(){let e=document.getElementById(`share-button`),t=document.getElementById(`mobile-share-button`);e&&e.addEventListener(`click`,function(){Gt(e)}),t&&t.addEventListener(`click`,function(){Gt(t)}),window.addEventListener(`hashchange`,()=>{window.location.hash.startsWith(`#share=`)&&Yt()})}function qt(){if(typeof pako>`u`)return console.error(`pako is undefined. Cannot load shared content.`),null;let e=``,t=window.location.hash;if(t.startsWith(`#share=`))e=t.slice(7);else{let t=window.location.href.match(/(?:#|%23)share=([^&?]*)/);t&&(e=t[1])}if(!e)return null;let n=e.match(/^[A-Za-z0-9\-_]+/);if(n)e=n[0];else return null;try{return Wt(e)}catch(e){return console.error(`Failed to decode shared content:`,e),alert(`The shared URL could not be decoded. It may be corrupted or incomplete.`),null}}function Jt(){let e=window.location.hash.match(/(?:&|\?)mode=([a-zA-Z]+)/);return e?e[1]:`split`}function Yt(){let e=qt();if(e===null)return;let t=L(e,`Shared Note`);y.tabs.push(t),y.activeTabId=t.id,n.value=e,A(Jt()),W(),N(y.tabs),P(y.activeTabId),R(y.tabs,y.activeTabId)}function Xt(){let e=document.getElementById(`tab-reset-btn`);e&&e.addEventListener(`click`,function(){et()});let t=document.getElementById(`logo-home`);t&&t.addEventListener(`click`,function(){et()})}function Zt(){document.addEventListener(`keydown`,async function(e){if((e.ctrlKey||e.metaKey)&&e.key===`s`){e.preventDefault();let t=y.tabs.find(e=>e.id===y.activeTabId);if(y.localVaultMode&&y.vaultDirHandle&&t)if(t.handle){await z(!0);let e=document.getElementById(`exportDropdown`);if(e){let t=e.innerHTML;e.innerHTML=`<i class="bi bi-check2"></i> <span class="btn-label">Saved</span>`,setTimeout(()=>{e.innerHTML=t},1500)}}else try{let e=prompt(`Save to Vault as:`,t.title+`.md`);if(e){e.endsWith(`.md`)||(e+=`.md`);let r;try{if(r=await y.vaultDirHandle.getFileHandle(e,{create:!1}),!confirm(`File "`+e+`" already exists. Overwrite?`))return;r=await y.vaultDirHandle.getFileHandle(e,{create:!0})}catch{r=await y.vaultDirHandle.getFileHandle(e,{create:!0})}let i=await r.createWritable();await i.write(t.content||n.value),await i.close(),t.handle=r,t.title=e.replace(/\.md$/i,``),t.id=`/`+e,R(y.tabs,y.activeTabId),await x();let a=document.getElementById(`exportDropdown`);if(a){let e=a.innerHTML;a.innerHTML=`<i class="bi bi-check2"></i> <span class="btn-label">Saved</span>`,setTimeout(()=>{a.innerHTML=e},1500)}}}catch(e){alert(`Error saving to vault: `+e.message)}else{let e=document.getElementById(`export-md`);e&&e.click()}}if((e.ctrlKey||e.metaKey)&&e.key===`c`){let t=document.activeElement,n=t&&(t.tagName===`TEXTAREA`||t.tagName===`INPUT`),r=window.getSelection&&window.getSelection().toString().trim().length>0;if(!n&&!r){e.preventDefault();let t=document.getElementById(`copy-markdown-button`);t&&t.click()}}(e.ctrlKey||e.metaKey)&&e.shiftKey&&e.key===`S`&&(e.preventDefault(),T===`split`&&Ce()),(e.ctrlKey||e.metaKey)&&e.key===`t`&&(e.preventDefault(),Ye()),(e.ctrlKey||e.metaKey)&&e.key===`w`&&(e.preventDefault(),Xe(y.activeTabId)),e.key===`Escape`&&ut()})}function Qt(e){let t=new FileReader;t.onload=function(t){Ye(t.target.result,e.name.replace(/\.md$/i,``));let n=document.getElementById(`dropzone`);n&&(n.style.display=`none`)},t.readAsText(e)}var J=document.getElementById(`dropzone`),Y=document.getElementById(`close-dropzone`),$t=document.getElementById(`file-input`);function en(){if(!J)return;[`dragenter`,`dragover`].forEach(t=>{J.addEventListener(t,e,!1)}),[`dragleave`,`drop`].forEach(e=>{J.addEventListener(e,t,!1)});function e(){J.classList.add(`active`)}function t(){J.classList.remove(`active`)}J.addEventListener(`drop`,n,!1),J.addEventListener(`click`,function(e){Y&&e.target!==Y&&!Y.contains(e.target)&&$t&&$t.click()}),Y&&Y.addEventListener(`click`,function(e){e.stopPropagation(),J.style.display=`none`});function n(e){let t=e.dataTransfer.files;if(t.length){let e=t[0];e.type===`text/markdown`||e.name.endsWith(`.md`)||e.name.endsWith(`.markdown`)?Qt(e):alert(`Please upload a Markdown file (.md or .markdown)`)}}}function X(e,t,n){let r,i=new Promise((e,i)=>{r=setTimeout(()=>i(Error(n)),t)});return Promise.race([e,i]).finally(()=>clearTimeout(r))}var tn={a4Width:210,a4Height:297,margin:15,contentWidth:180,contentHeight:267,windowWidth:1e3,scale:2};function nn(e){let t=[];return e.querySelectorAll(`img`).forEach(e=>t.push({element:e,type:`img`})),e.querySelectorAll(`svg`).forEach(e=>t.push({element:e,type:`svg`})),e.querySelectorAll(`pre`).forEach(e=>t.push({element:e,type:`pre`})),e.querySelectorAll(`table`).forEach(e=>t.push({element:e,type:`table`})),t}function rn(e,t){let n=t.getBoundingClientRect();return e.map(e=>{let t=e.element.getBoundingClientRect(),r=t.top-n.top,i=t.height;return{element:e.element,type:e.type,top:r,height:i,bottom:r+i}})}function an(e,t,n){let r=(t||793)*(n.contentHeight/n.contentWidth),i=[];if(r<10)return{boundaries:i,pageHeightPx:0};let a=r;for(;a<e;)i.push(a),a+=r;return{boundaries:i,pageHeightPx:r}}function on(e,t){if(!e||e.length===0||!t||t.length===0)return[];let n=[];for(let r of e){let e=0;for(let n=0;n<t.length&&r.top>=t[n];n++)e=n+1;let i=0;for(let e=0;e<t.length&&r.bottom>t[e];e++)i=e+1;if(i>e){let i=t[e]||t[0];n.push({element:r.element,type:r.type,top:r.top,height:r.height,splitPageIndex:e,overflowAmount:r.bottom-i})}}return n}function sn(e){try{let t=nn(e),n=rn(t,e),{boundaries:r,pageHeightPx:i}=an(e.scrollHeight,e.offsetWidth,tn),a=on(n,r);return{totalElements:t.length,splitElements:a,pageCount:r.length+1,pageBoundaries:r,pageHeightPx:i}}catch(e){return console.error(`Page-break analysis failed:`,e),{totalElements:0,splitElements:[],pageCount:1,pageBoundaries:[],pageHeightPx:0}}}var cn=.3;function ln(e,t){let n=[],r=[];for(let i of e)i.height<=t?n.push(i):r.push(i);return{fittingElements:n,oversizedElements:r}}function un(e,t){for(let n of e){let e=(n.splitPageIndex+1)*t,r=e-n.top;if(r/t>cn&&n.height*.9<=r)continue;let i=e-n.top+5,a=n.element;n.type===`svg`&&n.element.parentElement&&(a=n.element.parentElement);let o=parseFloat(a.style.marginTop)||0;a.style.marginTop=`${o+i}px`}}function dn(e,t,n=10){let r=0,i,a=-1;do{if(i=sn(e),!i.pageHeightPx||i.splitElements.length===0||i.splitElements.length===a)break;a=i.splitElements.length;let{fittingElements:t,oversizedElements:n}=ln(i.splitElements,i.pageHeightPx);if(i.oversizedElements=n,t.length===0)break;un(t,i.pageHeightPx),r++}while(r<n);return i}var fn=.5;function pn(e,t,n=5){let r=(t-n)/e,i=!1;return r<fn&&(r=fn,i=!0),{scaleFactor:r,wasClampedToMin:i}}function mn(e,t,n){let r=e.offsetHeight;n===`svg`&&(e.style.maxWidth=`none`),e.style.transform=`scale(${t})`,e.style.transformOrigin=`top left`;let i=r*t;e.style.marginBottom=`-${r-i}px`}function hn(e,t){if(!(!e||e.length===0))for(let n of e){let{scaleFactor:e}=pn(n.height,t);mn(n.element,e,n.type)}}async function gn(e,t,n){try{let r=t.innerHTML;t.innerHTML=`<i class="bi bi-hourglass-split"></i> Generating...`,t.disabled=!0;let i=document.createElement(`div`);i.style.position=`fixed`,i.style.top=`50%`,i.style.left=`50%`,i.style.transform=`translate(-50%, -50%)`,i.style.padding=`15px 20px`,i.style.backgroundColor=`rgba(0, 0, 0, 0.7)`,i.style.color=`white`,i.style.borderRadius=`5px`,i.style.zIndex=`9999`,i.style.textAlign=`center`;let a=document.createElement(`div`);a.textContent=`Generating PDF...`,i.appendChild(a),document.body.appendChild(i);let o=window.marked?window.marked.parse(e):marked.parse(e),s=DOMPurify.sanitize(o,{ADD_TAGS:[`mjx-container`,`svg`,`path`,`g`,`marker`,`defs`,`pattern`,`clipPath`],ADD_ATTR:[`id`,`class`,`style`,`viewBox`,`d`,`fill`,`stroke`,`transform`,`marker-end`,`marker-start`]}),c=document.createElement(`div`);c.className=`markdown-body pdf-export`,c.innerHTML=s,c.style.padding=`20px`,c.style.width=`210mm`,c.style.minWidth=`210mm`,c.style.maxWidth=`none`,c.style.margin=`0 auto`,c.style.fontSize=`14px`,c.style.position=`fixed`,c.style.left=`-9999px`,c.style.top=`0`,c.style.backgroundColor=n===`dark`?`#0d1117`:`#ffffff`,c.style.color=n===`dark`?`#c9d1d9`:`#24292e`,document.body.appendChild(c),await new Promise(e=>setTimeout(e,200));try{window.mermaid&&await X(window.mermaid.run({nodes:c.querySelectorAll(`.mermaid`),suppressErrors:!0}),3e3,`Mermaid rendering timed out`)}catch(e){console.warn(`Mermaid rendering issue:`,e)}if(window.MathJax){try{typeof MathJax.typesetPromise==`function`?await X(MathJax.typesetPromise([c]),3e3,`MathJax typesetting timed out`):MathJax.startup&&MathJax.startup.promise&&(await X(MathJax.startup.promise,3e3,`MathJax startup timed out`),typeof MathJax.typesetPromise==`function`&&await X(MathJax.typesetPromise([c]),3e3,`MathJax typesetting timed out`))}catch(e){console.warn(`MathJax rendering issue:`,e)}c.querySelectorAll(`mjx-assistive-mml`).forEach(e=>{e.style.display=`none`,e.style.visibility=`hidden`,e.style.position=`absolute`,e.style.width=`0`,e.style.height=`0`,e.style.overflow=`hidden`,e.remove()}),c.querySelectorAll(`script[type*="math"], script[type*="tex"]`).forEach(e=>e.remove())}await new Promise(e=>setTimeout(e,500));let l=dn(c,tn);l.oversizedElements&&l.pageHeightPx&&hn(l.oversizedElements,l.pageHeightPx);let u=new window.jspdf.jsPDF({orientation:`portrait`,unit:`mm`,format:`a4`,compress:!0,hotfixes:[`px_scaling`]}),d=u.internal.pageSize.getWidth(),f=u.internal.pageSize.getHeight(),p=d-30,m=window.getComputedStyle;window.getComputedStyle=function(e,t){let n=m.call(window,e,t);return new Proxy(n,{get(e,t){if(t===`getPropertyValue`)return function(t){let n=e.getPropertyValue.call(e,t);return typeof n==`string`&&/(oklch|oklab|lab|lch)\([^)]+\)/i.test(n)?n.replace(/(oklch|oklab|lab|lch)\([^)]+\)/gi,`rgb(0, 0, 0)`):n};let n=Reflect.get(e,t);return typeof n==`function`?n.bind(e):typeof n==`string`&&/(oklch|oklab|lab|lch)\([^)]+\)/i.test(n)?n.replace(/(oklch|oklab|lab|lch)\([^)]+\)/gi,`rgb(0, 0, 0)`):n}})};let h;try{h=await X(window.html2canvas(c,{scale:2,useCORS:!0,allowTaint:!0,logging:!1,windowWidth:1e3,windowHeight:c.scrollHeight}),1e4,`html2canvas rendering timed out`)}finally{window.getComputedStyle=m}let g=h.width/p;if(g<=0||!isFinite(g))throw Error(`Invalid canvas scale factor (width: ${h.width}, contentWidth: ${p})`);let ee=h.height/g,_=Math.ceil(ee/(f-30));if(_<=0||!isFinite(_))throw Error(`Invalid page count computed: ${_}`);for(let e=0;e<_;e++){e>0&&u.addPage();let t=e*(f-30)*g,n=Math.min(h.height-t,(f-30)*g),r=n/g,i=document.createElement(`canvas`);i.width=h.width,i.height=n,i.getContext(`2d`).drawImage(h,0,t,h.width,n,0,0,h.width,n);let a=i.toDataURL(`image/png`);u.addImage(a,`PNG`,15,15,p,r)}u.save(`document.pdf`),a.textContent=`Download successful!`,setTimeout(()=>document.body.removeChild(i),1500),document.body.removeChild(c),t.innerHTML=r,t.disabled=!1}catch(e){console.error(`PDF export failed:`,e),alert(`PDF export failed: `+e.message),t.innerHTML=`<i class="bi bi-file-earmark-pdf"></i> Export`,t.disabled=!1;let n=document.querySelector(`div[style*="Generating PDF"]`);n&&document.body.removeChild(n)}}function _n(){let e=document.getElementById(`export-md`),t=document.getElementById(`export-html`),r=document.getElementById(`export-pdf`),i=document.getElementById(`copy-markdown-button`);e.addEventListener(`click`,function(){try{let e=new Blob([n.value],{type:`text/markdown;charset=utf-8`});saveAs(e,`document.md`)}catch(e){console.error(`Export failed:`,e),alert(`Export failed: `+e.message)}}),t.addEventListener(`click`,function(){try{let e=n.value,t=marked.parse(e),r=DOMPurify.sanitize(t,{ADD_TAGS:[`mjx-container`],ADD_ATTR:[`id`,`class`,`style`]}),i=document.documentElement.getAttribute(`data-theme`)===`dark`,a=`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Markdown Export</title>
  <link rel="stylesheet" href="${i?`https://cdnjs.cloudflare.com/ajax/libs/github-markdown-css/5.3.0/github-markdown-dark.min.css`:`https://cdnjs.cloudflare.com/ajax/libs/github-markdown-css/5.3.0/github-markdown.min.css`}">
  <style>
      body {
          background-color: ${i?`#0d1117`:`#ffffff`};
          color: ${i?`#c9d1d9`:`#24292e`};
      }
      .markdown-body {
          box-sizing: border-box;
          min-width: 200px;
          max-width: 980px;
          margin: 0 auto;
          padding: 45px;
          background-color: ${i?`#0d1117`:`#ffffff`};
          color: ${i?`#c9d1d9`:`#24292e`};
      }

      /* Syntax Highlighting */
      .hljs-doctag, .hljs-keyword, .hljs-template-tag, .hljs-template-variable, .hljs-type, .hljs-variable.language_ { color: ${i?`#ff7b72`:`#d73a49`}; }
      .hljs-title, .hljs-title.class_, .hljs-title.class_.inherited__, .hljs-title.function_ { color: ${i?`#d2a8ff`:`#6f42c1`}; }
      .hljs-attr, .hljs-attribute, .hljs-literal, .hljs-meta, .hljs-number, .hljs-operator, .hljs-variable, .hljs-selector-attr, .hljs-selector-class, .hljs-selector-id { color: ${i?`#79c0ff`:`#005cc5`}; }
      .hljs-regexp, .hljs-string, .hljs-meta .hljs-string { color: ${i?`#a5d6ff`:`#032f62`}; }
      .hljs-built_in, .hljs-symbol { color: ${i?`#ffa657`:`#e36209`}; }
      .hljs-comment, .hljs-code, .hljs-formula { color: ${i?`#8b949e`:`#6a737d`}; }
      .hljs-name, .hljs-quote, .hljs-selector-tag, .hljs-selector-pseudo { color: ${i?`#7ee787`:`#22863a`}; }
      .hljs-subst { color: ${i?`#c9d1d9`:`#24292e`}; }
      .hljs-section { color: ${i?`#1f6feb`:`#005cc5`}; font-weight: bold; }
      .hljs-bullet { color: ${i?`#79c0ff`:`#005cc5`}; }
      .hljs-emphasis { font-style: italic; }
      .hljs-strong { font-weight: bold; }
      .hljs-addition { color: ${i?`#aff5b4`:`#22863a`}; background-color: ${i?`#033a16`:`#f0fff4`}; }
      .hljs-deletion { color: ${i?`#ffdcd7`:`#b31d28`}; background-color: ${i?`#67060c`:`#ffeef0`}; }

      @media (max-width: 767px) {
          .markdown-body {
              padding: 15px;
          }
      }
  </style>
</head>
<body>
  <article class="markdown-body">
      ${r}
  </article>
</body>
</html>`,o=new Blob([a],{type:`text/html;charset=utf-8`});saveAs(o,`document.html`)}catch(e){console.error(`HTML export failed:`,e),alert(`HTML export failed: `+e.message)}});let a=document.getElementById(`export-singlefile`);a&&a.addEventListener(`click`,async function(e){e.preventDefault();try{a.textContent=`Building…`;let[e,t]=await Promise.all([fetch(`styles.css`).then(e=>e.text()),fetch(`script.js`).then(e=>e.text())]),n=await fetch(`index.html`).then(e=>e.text()),r=new DOMParser().parseFromString(n,`text/html`);r.querySelectorAll(`link[href="styles.css"]`).forEach(t=>{let n=r.createElement(`style`);n.textContent=e,t.replaceWith(n)});let i=Array.from(r.querySelectorAll(`script`)).find(e=>e.src&&(e.src.includes(`script.js`)||e.src.includes(`main.js`)));if(i){let e=r.createElement(`script`);e.textContent=t,i.replaceWith(e)}let o=`<!DOCTYPE html>
`+r.documentElement.outerHTML,s=new Blob([o],{type:`text/html;charset=utf-8`}),c=URL.createObjectURL(s),l=document.createElement(`a`);l.href=c,l.download=`md-preview.html`,l.click(),URL.revokeObjectURL(c)}catch(e){alert(`Failed to build single file: `+e.message)}finally{a.innerHTML=`<i class="bi bi-file-zip me-1"></i>Download Single File (.html)`}}),r.addEventListener(`click`,async function(){let e=document.documentElement.getAttribute(`data-theme`);await gn(n.value,r,e)}),i.addEventListener(`click`,function(){try{let e=n.value;o(e)}catch(e){console.error(`Copy failed:`,e),alert(`Failed to copy Markdown: `+e.message)}});async function o(e){try{if(navigator.clipboard&&window.isSecureContext)await navigator.clipboard.writeText(e),s();else{let t=document.createElement(`textarea`);t.value=e,t.style.position=`fixed`,t.style.opacity=`0`,document.body.appendChild(t),t.focus(),t.select();let n=document.execCommand(`copy`);if(document.body.removeChild(t),n)s();else throw Error(`Copy command was unsuccessful`)}}catch(e){console.error(`Copy failed:`,e),alert(`Failed to copy HTML: `+e.message)}}function s(){let e=i.innerHTML;i.innerHTML=`<i class="bi bi-check-lg"></i> Copied!`,setTimeout(()=>{i.innerHTML=e},2e3)}}function vn(){document.getElementById(`import-md`)?.addEventListener(`click`,function(){e.click()});let e=document.getElementById(`file-input`);if(e?.addEventListener(`change`,function(e){let t=e.target.files[0];t&&Qt(t),this.value=``}),document.getElementById(`export-md`)?.addEventListener(`click`,function(){try{let e=new Blob([n.value],{type:`text/markdown;charset=utf-8`});saveAs(e,`document.md`)}catch(e){console.error(`Export failed:`,e),alert(`Export failed: `+e.message)}}),document.getElementById(`export-html`)?.addEventListener(`click`,function(){try{let e=n.value,t=marked.parse(e),r=DOMPurify.sanitize(t,{ADD_TAGS:[`mjx-container`],ADD_ATTR:[`id`,`class`,`style`]}),i=document.documentElement.getAttribute(`data-theme`)===`dark`,a=`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Markdown Export</title>
  <link rel="stylesheet" href="${i?`https://cdnjs.cloudflare.com/ajax/libs/github-markdown-css/5.3.0/github-markdown-dark.min.css`:`https://cdnjs.cloudflare.com/ajax/libs/github-markdown-css/5.3.0/github-markdown.min.css`}">
  <style>
      body {
          background-color: ${i?`#0d1117`:`#ffffff`};
          color: ${i?`#c9d1d9`:`#24292e`};
      }
      .markdown-body {
          box-sizing: border-box;
          min-width: 200px;
          max-width: 980px;
          margin: 0 auto;
          padding: 45px;
          background-color: ${i?`#0d1117`:`#ffffff`};
          color: ${i?`#c9d1d9`:`#24292e`};
      }

      /* Syntax Highlighting */
      .hljs-doctag, .hljs-keyword, .hljs-template-tag, .hljs-template-variable, .hljs-type, .hljs-variable.language_ { color: ${i?`#ff7b72`:`#d73a49`}; }
      .hljs-title, .hljs-title.class_, .hljs-title.class_.inherited__, .hljs-title.function_ { color: ${i?`#d2a8ff`:`#6f42c1`}; }
      .hljs-attr, .hljs-attribute, .hljs-literal, .hljs-meta, .hljs-number, .hljs-operator, .hljs-variable, .hljs-selector-attr, .hljs-selector-class, .hljs-selector-id { color: ${i?`#79c0ff`:`#005cc5`}; }
      .hljs-regexp, .hljs-string, .hljs-meta .hljs-string { color: ${i?`#a5d6ff`:`#032f62`}; }
      .hljs-built_in, .hljs-symbol { color: ${i?`#ffa657`:`#e36209`}; }
      .hljs-comment, .hljs-code, .hljs-formula { color: ${i?`#8b949e`:`#6a737d`}; }
      .hljs-name, .hljs-quote, .hljs-selector-tag, .hljs-selector-pseudo { color: ${i?`#7ee787`:`#22863a`}; }
      .hljs-subst { color: ${i?`#c9d1d9`:`#24292e`}; }
      .hljs-section { color: ${i?`#1f6feb`:`#005cc5`}; font-weight: bold; }
      .hljs-bullet { color: ${i?`#79c0ff`:`#005cc5`}; }
      .hljs-emphasis { font-style: italic; }
      .hljs-strong { font-weight: bold; }
      .hljs-addition { color: ${i?`#aff5b4`:`#22863a`}; background-color: ${i?`#033a16`:`#f0fff4`}; }
      .hljs-deletion { color: ${i?`#ffdcd7`:`#b31d28`}; background-color: ${i?`#67060c`:`#ffeef0`}; }

      @media (max-width: 767px) {
          .markdown-body {
              padding: 15px;
          }
      }
  </style>
</head>
<body>
  <article class="markdown-body">
      ${r}
  </article>
</body>
</html>`,o=new Blob([a],{type:`text/html;charset=utf-8`});saveAs(o,`document.html`)}catch(e){console.error(`HTML export failed:`,e),alert(`HTML export failed: `+e.message)}}),document.getElementById(`export-singlefile`)){let e=document.getElementById(`export-single-file`);e?.addEventListener(`click`,async function(t){t.preventDefault();try{e.textContent=`Building…`;let[t,n]=await Promise.all([fetch(`styles.css`).then(e=>e.text()),fetch(`script.js`).then(e=>e.text())]),r=await fetch(`index.html`).then(e=>e.text()),i=new DOMParser().parseFromString(r,`text/html`);i.querySelectorAll(`link[href="styles.css"]`).forEach(e=>{let n=i.createElement(`style`);n.textContent=t,e.replaceWith(n)});let a=Array.from(i.querySelectorAll(`script`)).find(e=>e.src&&(e.src.includes(`script.js`)||e.src.includes(`main.js`)));if(a){let e=i.createElement(`script`);e.textContent=n,a.replaceWith(e)}let o=`<!DOCTYPE html>
`+i.documentElement.outerHTML,s=new Blob([o],{type:`text/html;charset=utf-8`}),c=URL.createObjectURL(s),l=document.createElement(`a`);l.href=c,l.download=`md-preview.html`,l.click(),URL.revokeObjectURL(c)}catch(e){alert(`Failed to build single file: `+e.message)}finally{e.innerHTML=`<i class="bi bi-file-zip me-1"></i>Download Single File (.html)`}})}}function yn(){jt(),Bt();let e=document.getElementById(`backup-btn`),t=document.getElementById(`restore-btn`),n=document.getElementById(`restore-file-input`);async function r(){let e={version:1,exportedAt:new Date().toISOString(),data:{}},t=[m,h,g,_,v,`kido-privacy-dismissed`];for(let n of t){let t=await localforage.getItem(n);t!==null&&(e.data[n]=t)}let n=new Blob([JSON.stringify(e,null,2)],{type:`application/json`}),r=URL.createObjectURL(n),i=document.createElement(`a`);i.href=r,i.download=`kido-backup-`+new Date().toISOString().slice(0,10)+`.json`,i.click(),URL.revokeObjectURL(r)}function i(e){let t=new FileReader;t.onload=async function(e){try{let t=JSON.parse(e.target.result);if(!t.data||typeof t.data!=`object`){alert(`Invalid backup file format.`);return}if(!confirm(`This will replace all your current notes. Are you sure?`))return;for(let[e,n]of Object.entries(t.data))await localforage.setItem(e,n);alert(`Backup restored successfully! The page will reload.`),location.reload()}catch(e){alert(`Failed to read backup file: `+e.message)}},t.readAsText(e)}e&&e.addEventListener(`click`,e=>{e.preventDefault(),r()}),t&&t.addEventListener(`click`,e=>{e.preventDefault(),n.click()}),n&&n.addEventListener(`change`,e=>{e.target.files.length>0&&i(e.target.files[0]),n.value=``})}function bn(){let e=document.getElementById(`tag-filter-btn`),t=document.getElementById(`tag-filter-dropdown`),n=document.getElementById(`tag-filter-list`),r=document.getElementById(`tag-filter-clear`),i=null;function a(){let e=new Set;return y.tabs.forEach(t=>{(t.tags||[]).forEach(t=>e.add(t))}),Array.from(e).sort()}function o(){if(!n)return;let e=a();if(e.length===0){n.innerHTML=`<div style="padding:8px;color:var(--text-muted);font-size:12px;">No tags yet. Use the tab menu to add tags.</div>`;return}n.innerHTML=e.map(e=>`<div class="tag-filter-item`+(i===e?` active`:``)+`" data-tag="`+e+`"><i class="bi bi-tag"></i> `+e+`</div>`).join(``),n.querySelectorAll(`.tag-filter-item`).forEach(e=>{e.addEventListener(`click`,()=>{i=e.dataset.tag,o(),R(y.tabs.filter(e=>!i||e.tags&&e.tags.includes(i)),y.activeTabId),t.style.display=`none`})})}e&&e.addEventListener(`click`,()=>{let e=t.style.display!==`none`;t.style.display=e?`none`:`block`,e||o()}),r&&r.addEventListener(`click`,()=>{i=null,R(y.tabs,y.activeTabId),t.style.display=`none`}),document.addEventListener(`click`,e=>{t&&!e.target.closest(`#tag-filter-wrapper`)&&(t.style.display=`none`)})}var xn=document.getElementById(`search-btn`),Z=document.getElementById(`search-overlay`),Q=document.getElementById(`search-input`),$=document.getElementById(`search-results`);function Sn(){Z&&(Z.style.display=`flex`,setTimeout(()=>Q.focus(),50))}function Cn(){Z&&(Z.style.display=`none`,Q.value=``,$.innerHTML=`<div class="search-empty">Type to search across all your notes</div>`)}async function wn(e){if(!e||e.length<2){$.innerHTML=`<div class="search-empty">Type to search across all your notes</div>`;return}let t=[],n=e.toLowerCase();if(t=y.localVaultMode&&y.vaultMiniSearch?y.vaultMiniSearch.search(e,{prefix:!0,fuzzy:.2}).map(e=>({id:e.id,title:e.title||e.id.split(`/`).pop(),content:e.content||``,pinned:!1})):(await Pe()).filter(e=>e.title&&e.title.toLowerCase().includes(n)||e.content&&e.content.toLowerCase().includes(n)),t.length===0){$.innerHTML=`<div class="search-empty">No results found</div>`;return}$.innerHTML=t.map(t=>{let r=t.pinned?`<i class="bi bi-star-fill pinned-icon"></i>`:``,i=``;if(t.content){let r=t.content.toLowerCase().indexOf(n);if(r>=0){let n=Math.max(0,r-40),a=Math.min(t.content.length,r+e.length+40),o=t.content.slice(n,r),s=t.content.slice(r,r+e.length),c=t.content.slice(r+e.length,a);i=(n>0?`…`:``)+o+`<mark>`+s+`</mark>`+c+(a<t.content.length?`…`:``)}else i=t.content.slice(0,80)+(t.content.length>80?`…`:``)}return`<div class="search-result-item" data-tab-id="`+t.id+`"><div class="search-result-title">`+r+(t.title||`Untitled`)+`</div><div class="search-result-snippet">`+i+`</div></div>`}).join(``),$.querySelectorAll(`.search-result-item`).forEach(e=>{e.addEventListener(`click`,async()=>{let t=e.dataset.tabId,n=Q?Q.value.trim():``;if(y.localVaultMode){let e=y.vaultEntries?y.vaultEntries.find(e=>e.path===t):null;e&&await ce(e)}else await B(t);Cn(),n&&setTimeout(()=>{let e=document.getElementById(`preview-content`);if(!e)return;let t=document.createTreeWalker(e,NodeFilter.SHOW_TEXT),r=n.toLowerCase(),i;for(;i=t.nextNode();){let e=i.nodeValue.toLowerCase().indexOf(r);if(e!==-1){let t=document.createRange();t.setStart(i,e),t.setEnd(i,e+n.length);let r=document.createElement(`mark`);r.className=`search-scroll-highlight`,r.style.cssText=`background:rgba(168,85,247,0.5);border-radius:2px;color:inherit;`,t.surroundContents(r),r.scrollIntoView({behavior:`smooth`,block:`center`}),setTimeout(()=>{let e=r.parentNode;e&&(e.replaceChild(document.createTextNode(r.textContent),r),e.normalize())},2e3);break}}})})})}xn&&xn.addEventListener(`click`,Sn),Z&&Z.addEventListener(`click`,e=>{e.target===Z&&Cn()}),Q&&Q.addEventListener(`input`,()=>wn(Q.value)),document.addEventListener(`keydown`,e=>{(e.metaKey||e.ctrlKey)&&e.key===`k`&&(e.preventDefault(),Z&&Z.style.display===`flex`?Cn():Sn()),e.key===`Escape`&&Z&&Z.style.display===`flex`&&Cn()});var Tn=`markdownViewerTabs`,En=`markdownViewerActiveTab`,Dn=`markdownViewerUntitledCounter`,On=`kido-vault-handle`,kn=`markdownViewerGroups`;async function An(){let e=[Tn,En,Dn,kn,`kido-md-history`,`kido-privacy-dismissed`];for(let t of e){let e=localStorage.getItem(t);e!==null&&(await localforage.setItem(t,e),localStorage.removeItem(t))}}async function jn(){await An(),await jt(),y.tabGroups=await ze();let e=await localforage.getItem(On);if(e&&await se(e,!0),y.untitledCounter=await Ie(),y.tabs=await Pe(),y.activeTabId=await Fe(),y.tabs.length===0){if(!y.localVaultMode){let e=L(j,`Welcome to Markdown`);if(y.tabs.push(e),M!==void 0){let e=L(M,`30 chart`);y.tabs.push(e)}y.activeTabId=e.id,N(y.tabs),P(y.activeTabId)}}else y.tabs.find(e=>e.id===y.activeTabId)||(y.activeTabId=y.tabs[0].id,P(y.activeTabId));let t=qt();if(t!==null&&!y.localVaultMode){let e=L(t,`Shared Note`);y.tabs.push(e),y.activeTabId=e.id,n.value=t,A(Jt()),N(y.tabs),P(y.activeTabId)}else{let e=y.tabs.find(e=>e.id===y.activeTabId);if(e){if(e.handle&&y.localVaultMode)try{await e.handle.queryPermission({mode:`readwrite`})===`granted`&&(e.content=await(await e.handle.getFile()).text())}catch(e){console.warn(`Could not load active tab from file system on bootstrap, using cached content`,e)}n.value=e.content||``,A(e.viewMode)}}W(),requestAnimationFrame(()=>{if(!y.localVaultMode){let e=y.tabs.find(e=>e.id===y.activeTabId);e&&(n.scrollTop=e.scrollPos||0)}}),R(y.tabs,y.activeTabId),nt(),Xt(),Zt(),en(),_n(),vn(),yn(),bn(),Kt()}function Mn(){if(!window.driver)return;let e=document.getElementById(`privacy-notice`),t=document.getElementById(`privacy-dismiss`);e&&e.style.display!==`none`&&(t?t.click():e.style.display=`none`),T!==`split`&&k(`split`),window.driver.js.driver({showProgress:!0,animate:!0,allowClose:!0,nextBtnText:`Next ➔`,prevBtnText:`⬅ Back`,doneBtnText:`Done ✔`,steps:[{popover:{title:`Welcome to 2ndBrain! 🚀`,description:`Welcome to the premium Markdown Editor. Let's spend 1 minute to explore the outstanding features!`,align:`center`}},{element:`#sidebar-toc`,popover:{title:`Automatic Outline 📑`,description:`Automatically generates a table of contents based on Heading tags (H1, H2...). Click to jump quickly to the content.`,side:`right`,align:`start`}},{element:`#open-vault-btn`,popover:{title:`Connect Local Folder (Vault) 📂`,description:`A highly powerful feature! Grant the browser permission to read/write directly to a folder on your computer. Exactly how Obsidian works!`,side:`left`,align:`start`}},{element:`#sidebar-explorer`,popover:{title:`Local File Manager 🗂️`,description:`Your entire directory tree and documents will be shown here. Absolute privacy: no data is sent to external servers.`,side:`left`,align:`start`}},{element:`.tab-bar`,popover:{title:`Tabs & Tab Groups 📑`,description:`Open multiple files at once, color-code/group tabs together, just like Google Chrome!`,side:`bottom`,align:`start`}},{element:`#tag-filter-btn`,popover:{title:`Filter by Tag 🏷️`,description:`Just type #tag in your document; the system will auto-detect and let you filter files quickly here.`,side:`bottom`,align:`end`}},{element:`#tab-reset-btn`,popover:{title:`Reset All 🗑️`,description:`If you want to completely clean up the current cache and start fresh, click this button.`,side:`bottom`,align:`end`}},{element:`.editor-pane`,popover:{title:`High-speed Editing ⚡`,description:`Write Markdown here. You can drag & drop images or paste them directly. Remember to use Ctrl+S to save!`,side:`right`,align:`start`}},{element:`.preview-pane`,popover:{title:`Real-time Preview 👁️`,description:`See the results instantly. Supports Mathematics (MathJax), Syntax Highlighting (Highlight.js), and up to 30 types of diagrams (Mermaid.js)!`,side:`left`,align:`start`}},{element:`.view-mode-group`,popover:{title:`Display Modes 🪟`,description:`Code only, Split view, or Preview only. Click the "Hide" button to hide the header and focus completely.`,side:`bottom`,align:`center`}},{element:`#toggle-sync`,popover:{title:`Synchronized Scrolling ↕️`,description:`Synchronize scrolling between the Editor and Preview, ensuring you never lose track of your current line.`,side:`bottom`,align:`start`}},{element:`#import-button`,popover:{title:`Import File 📤`,description:`Quickly load a Markdown file (.md) from your computer into the editor.`,side:`bottom`,align:`start`}},{element:`#exportDropdown`,popover:{title:`Import/Export Options 📥`,description:`Export to HTML, PDF, Markdown, or download a full JSON backup of all files.`,side:`bottom`,align:`start`}},{element:`#copy-markdown-button`,popover:{title:`Copy Markdown 📋`,description:`Quickly copy the entire Markdown content to your clipboard in a single click.`,side:`bottom`,align:`start`}},{element:`#share-button`,popover:{title:`Serverless Sharing 🔗`,description:`Compresses your document into a sharing link. Friends can view it instantly without any database or sign-in!`,side:`bottom`,align:`end`}},{element:`#search-btn`,popover:{title:`Global Search 🔍`,description:`Press Ctrl+K to search your notes instantly across all files in your Vault.`,side:`bottom`,align:`end`}},{element:`#history-btn`,popover:{title:`Version History ⏱️`,description:`Accidentally deleted something? The system automatically saves version checkpoints so you can easily restore previous drafts.`,side:`bottom`,align:`end`}},{element:`#docThemeDropdown`,popover:{title:`Document Themes 🎨`,description:`Instantly style your documents with professional theme layouts, ranging from Academic to Hacker.`,side:`bottom`,align:`end`}},{element:`#tour-btn`,popover:{title:`Help & Tour ❓`,description:`You can replay this guided tour at any time by clicking this button. Happy writing!`,side:`left`,align:`center`}}]}).drive()}function Nn(){let e=document.getElementById(`tour-btn`);e&&e.addEventListener(`click`,Mn),!localStorage.getItem(`hasSeenTour`)&&window.innerWidth>=768&&setTimeout(()=>{Mn(),localStorage.setItem(`hasSeenTour`,`true`)},1e3)}function Pn(){let e=document.getElementById(`focus-mode-btn`),t=document.getElementById(`exit-focus-btn`),n=!1;function r(){n=!n,n?document.body.classList.add(`focus-mode`):document.body.classList.remove(`focus-mode`)}e&&e.addEventListener(`click`,r),t&&t.addEventListener(`click`,r),document.addEventListener(`keydown`,function(e){e.key===`Escape`&&n&&r()})}function Fn(){setInterval(async()=>{if(!y.localVaultMode||!y.vaultDirHandle)return;let e=y.tabs.find(e=>e.id===y.activeTabId);if(e){if(e.handle)e.lastVaultSave||=Date.now(),Date.now()-e.lastVaultSave>=9e4&&(await z(!0),e.lastVaultSave=Date.now(),console.log(`Vault file auto-saved`));else if(e.createdAt||=Date.now(),Date.now()-e.createdAt>=3e5)try{let t=e.title.replace(/[\\/:*?"<>|]/g,`-`);t.endsWith(`.md`)||(t+=`.md`);let n;try{n=await y.vaultDirHandle.getFileHandle(t,{create:!1}),t=t.replace(`.md`,`_`+Date.now()+`.md`),n=await y.vaultDirHandle.getFileHandle(t,{create:!0})}catch{n=await y.vaultDirHandle.getFileHandle(t,{create:!0})}e.handle=n,e.id=y.vaultDirHandle.name+`/`+t,e.lastVaultSave=Date.now(),await z(!0),typeof x==`function`&&x(),console.log(`Virtual file auto-saved to vault after 5 minutes`)}catch(e){console.error(`Auto-save failed`,e)}}},3e4)}function In(){u&&d&&u.addEventListener(`click`,()=>{d.classList.toggle(`collapsed`)}),f&&p&&f.addEventListener(`click`,()=>{p.classList.toggle(`collapsed`)})}n.value=j,document.addEventListener(`DOMContentLoaded`,()=>{ht(),St(),Ct(),Vt(),Ne(),jn(),Fn(),Pn(),Nn(),ft(),In()});