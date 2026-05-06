document.addEventListener("DOMContentLoaded", function () {
  let markdownRenderTimeout = null;
  const RENDER_DELAY = 100;
  let syncScrollingEnabled = true;
  let isEditorScrolling = false;
  let isPreviewScrolling = false;
  let scrollSyncTimeout = null;
  const SCROLL_SYNC_DELAY = 10;

  // View Mode State - Story 1.1
  let currentViewMode = 'split'; // 'editor', 'split', or 'preview'

  const markdownEditor = document.getElementById("markdown-editor");
  const markdownPreview = document.getElementById("markdown-preview");
  const themeToggle = document.getElementById("theme-toggle");
  const importButton = document.getElementById("import-button");
  const fileInput = document.getElementById("file-input");
  const exportMd = document.getElementById("export-md");
  const exportHtml = document.getElementById("export-html");
  const exportPdf = document.getElementById("export-pdf");
  const copyMarkdownButton = document.getElementById("copy-markdown-button");
  const dropzone = document.getElementById("dropzone");
  const closeDropzoneBtn = document.getElementById("close-dropzone");
  const toggleSyncButton = document.getElementById("toggle-sync");
  const editorPane = document.getElementById("markdown-editor");
  const previewPane = document.querySelector(".preview-pane");
  const readingTimeElement = document.getElementById("reading-time");
  const wordCountElement = document.getElementById("word-count");
  const charCountElement = document.getElementById("char-count");

  // View Mode Elements - Story 1.1
  const contentContainer = document.querySelector(".content-container");
  const viewModeButtons = document.querySelectorAll(".view-mode-btn:not(.focus-mode-toggle-btn)");

  // Mobile View Mode Elements - Story 1.4
  const mobileViewModeButtons = document.querySelectorAll(".mobile-view-mode-btn");

  // Resize Divider Elements - Story 1.3
  const resizeDivider = document.querySelector(".resize-divider");
  const editorPaneElement = document.querySelector(".editor-pane");
  const previewPaneElement = document.querySelector(".preview-pane");
  let isResizing = false;
  let editorWidthPercent = 50; // Default 50%
  const MIN_PANE_PERCENT = 20; // Minimum 20% width

  const mobileMenuToggle    = document.getElementById("mobile-menu-toggle");
  const mobileMenuPanel     = document.getElementById("mobile-menu-panel");
  const mobileMenuOverlay   = document.getElementById("mobile-menu-overlay");
  const mobileCloseMenu     = document.getElementById("close-mobile-menu");
  const mobileReadingTime   = document.getElementById("mobile-reading-time");
  const mobileWordCount     = document.getElementById("mobile-word-count");
  const mobileCharCount     = document.getElementById("mobile-char-count");
  const mobileToggleSync    = document.getElementById("mobile-toggle-sync");
  const mobileImportBtn     = document.getElementById("mobile-import-button");
  const mobileExportMd      = document.getElementById("mobile-export-md");
  const mobileExportHtml    = document.getElementById("mobile-export-html");
  const mobileExportPdf     = document.getElementById("mobile-export-pdf");
  const mobileCopyMarkdown  = document.getElementById("mobile-copy-markdown");
  const mobileThemeToggle   = document.getElementById("mobile-theme-toggle");
  const shareButton         = document.getElementById("share-button");
  const mobileShareButton   = document.getElementById("mobile-share-button");

  // Check dark mode preference first for proper initialization
  const prefersDarkMode =
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;
  
  document.documentElement.setAttribute(
    "data-theme",
    prefersDarkMode ? "dark" : "light"
  );
  
  themeToggle.innerHTML = prefersDarkMode
    ? '<i class="bi bi-sun"></i>'
    : '<i class="bi bi-moon"></i>';

  const initMermaid = () => {
    const currentTheme = document.documentElement.getAttribute("data-theme");
    const mermaidTheme = currentTheme === "dark" ? "dark" : "default";
    
    mermaid.initialize({
      startOnLoad: false,
      theme: mermaidTheme,
      securityLevel: 'loose',
      flowchart: { useMaxWidth: true, htmlLabels: true },
      fontSize: 16
    });
  };

  try {
    initMermaid();
  } catch (e) {
    console.warn("Mermaid initialization failed:", e);
  }

  const markedOptions = {
    gfm: true,
    breaks: false,
    pedantic: false,
    sanitize: false,
    smartypants: false,
    xhtml: false,
    headerIds: true,
    mangle: false,
  };

  const renderer = new marked.Renderer();
  renderer.code = function (code, language) {
    if (language === 'mermaid') {
      const uniqueId = 'mermaid-diagram-' + Math.random().toString(36).substr(2, 9);
      
      // Workaround for Mermaid v11+ "Unsupported markdown: list" error in flowcharts
      // Replace spaces after list-like markers with non-breaking spaces
      const fixedCode = code
        .replace(/(\b\d+\.)\s+/g, '$1&nbsp;')
        .replace(/(^|[\[\(|]\s*)([-*+])\s+/g, '$1$2&nbsp;');
        
      return `<div class="mermaid-container"><div class="mermaid" id="${uniqueId}">${fixedCode}</div></div>`;
    }
    
    const validLanguage = hljs.getLanguage(language) ? language : "plaintext";
    const highlightedCode = hljs.highlight(code, {
      language: validLanguage,
    }).value;
    return `<pre><code class="hljs ${validLanguage}">${highlightedCode}</code></pre>`;
  };

  marked.setOptions({
    ...markedOptions,
    renderer: renderer,
  });

  // Auto-detect raw Mermaid syntax pasted without code blocks
  const originalMarkedParse = marked.parse;
  marked.parse = function(mdString, options) {
    try {
      let lines = mdString.split('\n');
      let newLines = [];
      let inMermaid = false;
      let inCodeBlock = false;
      
      const mermaidStart = /^(flowchart|sequenceDiagram|classDiagram|stateDiagram|stateDiagram-v2|erDiagram|journey|gantt|pie|gitGraph|mindmap|timeline|graph|architecture-beta|architecture|sankey-beta|xychart-beta|block-beta|packet-beta|ishikawa)\b/i;
      
      const looksLikeMermaid = (l) => {
        const t = l.trim();
        if (!t) return true;
        if (/^[ \t]/.test(l)) return true; // indented
        if (/^(subgraph|end|click|style|class|classDef|linkStyle|direction|note|participant|actor|activate|deactivate|group|service)\b/i.test(t)) return true;
        if (/[-\=]+\>/.test(t) || t.includes('---') || t.includes('===')) return true;
        if (/\[.*\]|\(.*\)|{.*}|>.*\]/.test(t)) return true;
        if (t.includes(':')) return true;
        if (/^[A-Za-z0-9_]+$/.test(t)) return true;
        return false;
      };

      for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        
        if (line.trim().startsWith('\`\`\`')) {
          inCodeBlock = !inCodeBlock;
          newLines.push(line);
          continue;
        }
        
        if (!inCodeBlock && !inMermaid && mermaidStart.test(line.trim())) {
          inMermaid = true;
          newLines.push('\`\`\`mermaid');
          newLines.push(line);
          continue;
        }
        
        if (inMermaid) {
          if (/^(#{1,6}\s|\-\-\-|> \s|\*\s|\-\s|\d+\.\s)/.test(line)) {
            newLines.push('\`\`\`');
            inMermaid = false;
            newLines.push(line);
            continue;
          }
          
          if (i > 0 && lines[i-1].trim() === '' && line.trim() !== '') {
             if (!looksLikeMermaid(line)) {
               newLines.push('\`\`\`');
               inMermaid = false;
               newLines.push(line);
               continue;
             }
          }
        }
        
        newLines.push(line);
      }
      
      if (inMermaid) {
        newLines.push('\`\`\`');
      }
      
      return originalMarkedParse(newLines.join('\n'), options);
    } catch (e) {
      console.warn("Markdown parsing error, fallback to original parser:", e);
      return originalMarkedParse(mdString, options);
    }
  };

  const sampleMarkdown = `# Welcome to Markdown Viewer

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

This is a fully client-side application. Your content never leaves your browser and stays secure on your device.`;

  markdownEditor.value = sampleMarkdown;

  // ========================================
  // DOCUMENT TABS & SESSION MANAGEMENT
  // ========================================

  const STORAGE_KEY = 'markdownViewerTabs';
  const ACTIVE_TAB_KEY = 'markdownViewerActiveTab';
  const UNTITLED_COUNTER_KEY = 'markdownViewerUntitledCounter';
  const VAULT_HANDLE_KEY = 'kido-vault-handle';
  let tabs = [];
  let activeTabId = null;
  let draggedTabId = null;
  let saveTabStateTimeout = null;
  let untitledCounter = 0;

  // Vault variables
  let localVaultMode = false;
  let vaultDirHandle = null;
  let vaultMiniSearch = null;
  let vaultEntries = [];
  let expandedVaultPaths = new Set();

  async function doVaultRename(entry, newName, fallbackCb) {
    try {
      if (entry.handle.kind === 'directory') {
         const destDirHandle = await entry.parentDir.getDirectoryHandle(newName, { create: true });
         async function copyDir(srcDir, destDir) {
            for await (const [name, handle] of srcDir.entries()) {
              if (handle.kind === 'file') {
                const file = await handle.getFile();
                const destFile = await destDir.getFileHandle(name, { create: true });
                const writable = await destFile.createWritable();
                await writable.write(await file.arrayBuffer());
                await writable.close();
              } else if (handle.kind === 'directory') {
                const subDestDir = await destDir.getDirectoryHandle(name, { create: true });
                await copyDir(handle, subDestDir);
              }
            }
         }
         await copyDir(entry.handle, destDirHandle);
         await entry.parentDir.removeEntry(entry.name, { recursive: true });
         
         let group = tabGroups.find(g => g.name === entry.name);
         if (group) { 
           group.name = newName; 
           renderTabBar(tabs, activeTabId); 
           if(typeof saveTabGroups === 'function') saveTabGroups(); 
         }
      } else {
         if (!newName.endsWith('.md')) newName += '.md';
         const file = await entry.handle.getFile();
         const text = await file.text();
         const newHandle = await entry.parentDir.getFileHandle(newName, { create: true });
         const writable = await newHandle.createWritable();
         await writable.write(text);
         await writable.close();
         await entry.parentDir.removeEntry(entry.name);
         
         // Fix active tab logic
         if (activeTabId === entry.path) {
           const parentPath = entry.path.substring(0, entry.path.lastIndexOf('/'));
           activeTabId = parentPath + '/' + newName;
         }
         
         // Update loaded tabs
         let tab = tabs.find(t => t.id === entry.path);
         if (tab) {
           const parentPath = entry.path.substring(0, entry.path.lastIndexOf('/'));
           tab.id = parentPath + '/' + newName;
           tab.title = newName;
           tab.handle = newHandle;
         }
      }
      await renderVaultTree();
    } catch (err) {
      alert('Rename failed: ' + err.message);
      if (fallbackCb) fallbackCb();
    }
  }

  function startInlineRename(element, originalName, onComplete) {
    const input = document.createElement('input');
    input.type = 'text';
    input.value = originalName;
    input.className = 'inline-rename-input';
    
    let isFinished = false;
    const finish = (val) => {
      if (isFinished) return;
      isFinished = true;
      onComplete(val);
    };

    input.onblur = () => finish(input.value.trim());
    input.onkeydown = (e) => {
      if (e.key === 'Enter') finish(input.value.trim());
      if (e.key === 'Escape') finish(originalName);
    };

    element.replaceWith(input);
    input.focus();
    input.select();
  }

  async function openLocalVault() {
    try {
      vaultDirHandle = await window.showDirectoryPicker({ mode: 'readwrite' });
      await localforage.setItem(VAULT_HANDLE_KEY, vaultDirHandle);
      await initVault(vaultDirHandle);
    } catch (e) {
      // User cancelled
    }
  }

  async function initVault(handle) {
    if (!handle) return;
    vaultDirHandle = handle;
    localVaultMode = true;
    document.querySelector('.empty-vault-message').style.display = 'none';

    if (await vaultDirHandle.queryPermission({ mode: 'readwrite' }) !== 'granted') {
      const btn = document.createElement('button');
      btn.className = 'tool-button';
      btn.style.margin = '10px';
      btn.innerText = 'Re-authorize Vault Access';
      btn.onclick = async () => {
        if (await vaultDirHandle.requestPermission({ mode: 'readwrite' }) === 'granted') {
          await renderVaultTree();
        }
      };
      const tree = document.getElementById('file-tree');
      tree.innerHTML = '';
      tree.appendChild(btn);
      return;
    }
    
    // Clear virtual tabs completely to focus on Vault
    tabs = [];
    activeTabId = null;
    markdownEditor.value = '';
    renderTabBar(tabs, activeTabId);
    
    document.getElementById('root-new-folder-btn').style.display = 'inline-flex';
    document.getElementById('root-new-file-btn').style.display = 'inline-flex';
    if(document.querySelector('.vault-action-divider')) document.querySelector('.vault-action-divider').style.display = 'block';

    const handleRootNewFile = async () => {
      try {
        let name = prompt('New Markdown File Name at Root:');
        if (name) {
          if (!name.endsWith('.md')) name += '.md';
          await vaultDirHandle.getFileHandle(name, { create: true });
          await renderVaultTree();
        }
      } catch (e) { alert('Error: ' + e.message); }
    };

    const handleRootNewFolder = async () => {
      try {
        let name = prompt('New Folder Name at Root:');
        if (name) {
          await vaultDirHandle.getDirectoryHandle(name, { create: true });
          await renderVaultTree();
        }
      } catch (e) { alert('Error: ' + e.message); }
    };
    
    // Unbind and rebind
    const fileBtn = document.getElementById('root-new-file-btn');
    const folderBtn = document.getElementById('root-new-folder-btn');
    fileBtn.replaceWith(fileBtn.cloneNode(true));
    folderBtn.replaceWith(folderBtn.cloneNode(true));
    document.getElementById('root-new-file-btn').addEventListener('click', handleRootNewFile);
    document.getElementById('root-new-folder-btn').addEventListener('click', handleRootNewFolder);

    await renderVaultTree();
  }

  async function openVaultFile(entry) {
    let tab = tabs.find(t => t.id === entry.path);
    if (!tab) {
      tab = createTab('', entry.name);
      tab.id = entry.path; // force path as ID
      tab.handle = entry.handle;
      
      const segments = entry.path.split('/').filter(Boolean);
      if (segments.length > 1) {
        const folderName = segments[segments.length - 2];
        let group = tabGroups.find(g => g.name === folderName);
        if (!group) {
          group = createGroup(folderName, GROUP_COLORS[Math.floor(Math.random() * GROUP_COLORS.length)].name);
        }
        tab.groupId = group.id;
      }

      tabs.push(tab);
    }
    await switchTab(tab.id);
  }

  async function renderVaultTree() {
    const treeEl = document.getElementById('file-tree');
    treeEl.innerHTML = '';
    
    // Prepare MiniSearch
    if (window.MiniSearch) {
      vaultMiniSearch = new window.MiniSearch({
        fields: ['title', 'content'], 
        storeFields: ['title', 'content', 'path']
      });
    }

    const buildTree = async (dirHandle, path, parentEl) => {
      let entries = [];
      for await (const [name, handle] of dirHandle.entries()) {
        if (name.startsWith('.')) continue;
        entries.push({ name, handle, path: path + '/' + name, parentDir: dirHandle });
      }
      entries.sort((a, b) => {
        if (a.handle.kind === b.handle.kind) return a.name.localeCompare(b.name);
        return a.handle.kind === 'directory' ? -1 : 1;
      });

      for (const entry of entries) {
        const node = document.createElement('div');
        node.className = 'tree-node' + (entry.handle.kind === 'directory' ? ' is-dir' : '');
        
        let iconHtml = `<i class="bi bi-${entry.handle.kind === 'directory' ? 'folder' : 'file-text'}"></i>`;
        let titleHtml = `<span class="tree-node-title" title="${entry.name}">${entry.name}</span>`;
        let actionsHtml = `<div class="tree-node-actions">`;
        if (entry.handle.kind === 'directory') {
          actionsHtml += `<button class="tree-node-action-btn" title="New File" data-action="new-file"><i class="bi bi-file-earmark-plus"></i></button>`;
          actionsHtml += `<button class="tree-node-action-btn" title="New Folder" data-action="new-folder"><i class="bi bi-folder-plus"></i></button>`;
        }
        actionsHtml += `<button class="tree-node-action-btn" title="Rename" data-action="rename"><i class="bi bi-pencil"></i></button>`;
        actionsHtml += `<button class="tree-node-action-btn" title="Delete" data-action="delete"><i class="bi bi-trash"></i></button>`;
        actionsHtml += `</div>`;
        
        node.innerHTML = iconHtml + titleHtml + actionsHtml;
        parentEl.appendChild(node);
        
        let childrenCont = null;
        if (entry.handle.kind === 'directory') {
          childrenCont = document.createElement('div');
          childrenCont.className = 'tree-children';
          childrenCont.style.paddingLeft = '16px';
          parentEl.appendChild(childrenCont);
          
          if (expandedVaultPaths.has(entry.path)) {
            childrenCont.classList.add('expanded');
            node.querySelector('i').className = 'bi bi-folder2-open';
          }
          
          await buildTree(entry.handle, entry.path, childrenCont);
        }

        node.onclick = async (e) => {
          const actionBtn = e.target.closest('.tree-node-action-btn');
          if (actionBtn) {
            e.stopPropagation();
            const action = actionBtn.dataset.action;
            try {
              if (action === 'new-file') {
                let name = prompt('New Markdown File Name:');
                if (name) {
                  if (!name.endsWith('.md')) name += '.md';
                  await entry.handle.getFileHandle(name, { create: true });
                  expandedVaultPaths.add(entry.path);
                  await renderVaultTree();
                }
              } else if (action === 'new-folder') {
                let name = prompt('New Folder Name:');
                if (name) {
                  await entry.handle.getDirectoryHandle(name, { create: true });
                  expandedVaultPaths.add(entry.path);
                  await renderVaultTree();
                }
              } else if (action === 'delete') {
                if (confirm('Are you sure you want to delete "' + entry.name + '"?')) {
                  await entry.parentDir.removeEntry(entry.name, { recursive: true });
                  await renderVaultTree();
                }
              } else if (action === 'rename') {
                const titleSpan = node.querySelector('.tree-node-title');
                startInlineRename(titleSpan, entry.name, async (newName) => {
                  if (newName && newName !== entry.name) {
                    const originalHtml = actionBtn.innerHTML;
                    actionBtn.innerHTML = '<i class="bi bi-hourglass-split"></i>';
                    await doVaultRename(entry, newName, () => {
                      titleSpan.replaceWith(titleSpan.cloneNode(true)); // restore on fail
                    });
                  } else {
                    await renderVaultTree(); // restore instantly if unchanged
                  }
                });
              }
            } catch (err) {
              alert('Action failed: ' + err.message);
            }
            return;
          }

          e.stopPropagation();
          if (entry.handle.kind === 'directory') {
            childrenCont.classList.toggle('expanded');
            if (childrenCont.classList.contains('expanded')) {
               expandedVaultPaths.add(entry.path);
            } else {
               expandedVaultPaths.delete(entry.path);
            }
            node.querySelector('i').className = `bi bi-${childrenCont.classList.contains('expanded') ? 'folder2-open' : 'folder'}`;
          } else if (entry.name.endsWith('.md')) {
            await openVaultFile(entry);
            document.querySelectorAll('.tree-node').forEach(n => n.classList.remove('active'));
            node.classList.add('active');
          }
        };

        const titleSpan = node.querySelector('.tree-node-title');
        titleSpan.ondblclick = (e) => {
          e.stopPropagation();
          startInlineRename(titleSpan, entry.name, async (newName) => {
            if (newName && newName !== entry.name) {
              await doVaultRename(entry, newName);
            } else {
              await renderVaultTree();
            }
          });
        };

        if (entry.handle.kind === 'file' && entry.name.endsWith('.md')) {
          entry.handle.getFile().then(f => f.text()).then(text => {
            if (vaultMiniSearch) {
               vaultMiniSearch.add({ id: entry.path, title: entry.name, path: entry.path, content: text });
            }
          });
        }
      }
    };

    await buildTree(vaultDirHandle, '', treeEl);
    await checkVirtualSync();
  }
  
  async function checkVirtualSync() {
    const syncBtn = document.getElementById('sync-vault-btn');
    if (!syncBtn) return;
    
    if (localVaultMode && vaultDirHandle) {
      try {
        const virtualTabsText = await localforage.getItem(STORAGE_KEY);
        const virtualTabs = virtualTabsText ? JSON.parse(virtualTabsText) : [];
        if (virtualTabs && virtualTabs.length > 0) {
          syncBtn.style.display = 'inline-flex';
          syncBtn.onclick = async () => {
            if (!confirm('Import ' + virtualTabs.length + ' virtual notes into your Vault?')) return;
            try {
              for (const t of virtualTabs) {
                const safeTitle = (t.title || 'Untitled').replace(/[\\/:*?"<>|]/g, '-');
                let filename = safeTitle + '.md';
                let fileHandle;
                try {
                  fileHandle = await vaultDirHandle.getFileHandle(filename, { create: false });
                  // If it doesn't throw, the file exists, so we append a timestamp
                  filename = safeTitle + '_' + Date.now() + '.md';
                  fileHandle = await vaultDirHandle.getFileHandle(filename, { create: true });
                } catch(e) {
                  // File does not exist, safe to create
                  fileHandle = await vaultDirHandle.getFileHandle(filename, { create: true });
                }
                const writable = await fileHandle.createWritable();
                await writable.write(t.content || '');
                await writable.close();
              }
              alert('Import successful! Virtual notes are now in your vault.');
              await localforage.removeItem(STORAGE_KEY); // Option: Clean up virtual space since it's imported
              syncBtn.style.display = 'none';
              await renderVaultTree();
            } catch(e) {
              alert('Error importing notes: ' + e.message);
            }
          };
        } else {
          syncBtn.style.display = 'none';
        }
      } catch (e) {
        syncBtn.style.display = 'none';
      }
    } else {
      syncBtn.style.display = 'none';
    }
  }

  // Hook "Open Vault" button
  const openVaultBtn = document.getElementById('open-vault-btn');
  if (openVaultBtn) {
    openVaultBtn.addEventListener('click', openLocalVault);
  }

  // Resizer logic
  const sidebarResizer = document.getElementById('sidebar-resizer');
  const sidebarExplorer = document.getElementById('sidebar-explorer');
  let isResizingSidebar = false;

  if (sidebarResizer) {
    sidebarResizer.addEventListener('mousedown', (e) => {
      isResizingSidebar = true;
      document.body.style.cursor = 'col-resize';
      sidebarResizer.classList.add('dragging');
      e.preventDefault();
    });
    document.addEventListener('mousemove', (e) => {
      if (!isResizingSidebar) return;
      sidebarExplorer.style.width = Math.max(150, Math.min(e.clientX, window.innerWidth - 300)) + 'px';
    });
    document.addEventListener('mouseup', () => {
      if (isResizingSidebar) {
        isResizingSidebar = false;
        document.body.style.cursor = 'default';
        sidebarResizer.classList.remove('dragging');
      }
    });
  }

  async function migrateFromLocalStorage() {
    const keys = [STORAGE_KEY, ACTIVE_TAB_KEY, UNTITLED_COUNTER_KEY, GROUPS_KEY, 'kido-md-history', 'kido-privacy-dismissed'];
    for (const key of keys) {
      const val = localStorage.getItem(key);
      if (val !== null) {
        await localforage.setItem(key, val);
        localStorage.removeItem(key);
      }
    }
  }

  async function loadTabsFromStorage() {
    try {
      const data = await localforage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  function saveTabsToStorage(tabsArr) {
    if (localVaultMode) return; // Do not save entire array into IndexedDB in block when vault is active
    try {
      localforage.setItem(STORAGE_KEY, JSON.stringify(tabsArr));
    } catch (e) {
      console.warn('Failed to save tabs to localforage:', e);
    }
  }

  async function loadActiveTabId() {
    return await localforage.getItem(ACTIVE_TAB_KEY);
  }

  function saveActiveTabId(id) {
    if (localVaultMode) return;
    localforage.setItem(ACTIVE_TAB_KEY, id);
  }

  async function loadUntitledCounter() {
    const val = await localforage.getItem(UNTITLED_COUNTER_KEY);
    return parseInt(val || '0', 10);
  }

  function saveUntitledCounter(val) {
    localforage.setItem(UNTITLED_COUNTER_KEY, String(val));
  }

  function nextUntitledTitle() {
    untitledCounter += 1;
    saveUntitledCounter(untitledCounter);
    return 'Untitled ' + untitledCounter;
  }

  // ============================================
  // Tab Groups (Chrome-style)
  // ============================================
  const GROUPS_KEY = 'mdPreviewTabGroups';
  const GROUP_COLORS = [
    { name: 'gray',   bg: 'rgba(156,163,175,0.25)', border: '#9ca3af', dot: '#9ca3af' },
    { name: 'blue',   bg: 'rgba(59,130,246,0.2)',  border: '#3b82f6', dot: '#3b82f6' },
    { name: 'purple', bg: 'rgba(168,85,247,0.2)',  border: '#a855f7', dot: '#a855f7' },
    { name: 'green',  bg: 'rgba(34,197,94,0.2)',   border: '#22c55e', dot: '#22c55e' },
    { name: 'yellow', bg: 'rgba(234,179,8,0.25)',  border: '#eab308', dot: '#eab308' },
    { name: 'orange', bg: 'rgba(249,115,22,0.2)',  border: '#f97316', dot: '#f97316' },
    { name: 'red',    bg: 'rgba(239,68,68,0.2)',   border: '#ef4444', dot: '#ef4444' },
    { name: 'pink',   bg: 'rgba(236,72,153,0.2)',  border: '#ec4899', dot: '#ec4899' }
  ];

  let tabGroups = [];

  async function loadGroups() {
    try { 
      const data = await localforage.getItem(GROUPS_KEY);
      return data ? JSON.parse(data) : []; 
    } catch { return []; }
  }

  function saveGroups() {
    localforage.setItem(GROUPS_KEY, JSON.stringify(tabGroups));
  }

  function createGroup(name, colorName) {
    const color = GROUP_COLORS.find(c => c.name === colorName) || GROUP_COLORS[2]; // default purple
    const group = {
      id: 'grp_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      name: name || 'New Group',
      color: color.name,
      collapsed: false
    };
    tabGroups.push(group);
    saveGroups();
    return group;
  }

  function deleteGroup(groupId) {
    // Ungroup all tabs in this group
    tabs.forEach(t => { if (t.groupId === groupId) t.groupId = null; });
    tabGroups = tabGroups.filter(g => g.id !== groupId);
    saveGroups();
    saveTabsToStorage(tabs);
    renderTabBar(tabs, activeTabId);
  }

  function renameGroup(groupId) {
    const group = tabGroups.find(g => g.id === groupId);
    if (!group) return;
    const newName = prompt('Rename group:', group.name);
    if (newName === null) return;
    group.name = newName.trim() || 'Unnamed';
    saveGroups();
    renderTabBar(tabs, activeTabId);
  }

  function toggleGroupCollapse(groupId) {
    const group = tabGroups.find(g => g.id === groupId);
    if (!group) return;
    group.collapsed = !group.collapsed;
    saveGroups();
    renderTabBar(tabs, activeTabId);
  }

  function changeGroupColor(groupId, colorName) {
    const group = tabGroups.find(g => g.id === groupId);
    if (!group) return;
    group.color = colorName;
    saveGroups();
    renderTabBar(tabs, activeTabId);
  }

  function addTabToGroup(tabId, groupId) {
    const tab = tabs.find(t => t.id === tabId);
    if (tab) {
      tab.groupId = groupId;
      saveTabsToStorage(tabs);
      renderTabBar(tabs, activeTabId);
    }
  }

  function removeTabFromGroup(tabId) {
    const tab = tabs.find(t => t.id === tabId);
    if (tab) {
      tab.groupId = null;
      saveTabsToStorage(tabs);
      renderTabBar(tabs, activeTabId);
    }
  }

  function getGroupColor(colorName) {
    return GROUP_COLORS.find(c => c.name === colorName) || GROUP_COLORS[0];
  }

  // Load groups on init
  tabGroups = loadGroups();

  function createTab(content, title, viewMode) {
    if (content === undefined) content = '';
    if (title === undefined) title = null;
    if (viewMode === undefined) viewMode = 'split';
    return {
      id: 'tab_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8),
      title: title || 'Untitled',
      content: content,
      scrollPos: 0,
      viewMode: viewMode,
      createdAt: Date.now()
    };
  }

  function renderTabBar(tabsArr, currentActiveTabId) {
    const tabList = document.getElementById('tab-list');
    if (!tabList) return;
    tabList.innerHTML = '';

    // Build group submenu HTML for tab context menus
    function buildGroupSubmenu(currentTabGroupId) {
      let html = '<div class="tab-group-submenu">';
      html += '<button class="tab-menu-item" data-action="new-group"><i class="bi bi-folder-plus"></i> New Group</button>';
      if (tabGroups.length > 0) {
        html += '<div class="tab-ctx-divider"></div>';
        tabGroups.forEach(g => {
          const gc = getGroupColor(g.color);
          const check = currentTabGroupId === g.id ? ' ✓' : '';
          html += '<button class="tab-menu-item" data-action="add-to-group" data-group-id="' + g.id + '">' +
            '<span class="group-color-dot" style="background:' + gc.dot + '"></span> ' + (g.name || 'Unnamed') + check + '</button>';
        });
      }
      if (currentTabGroupId) {
        html += '<div class="tab-ctx-divider"></div>';
        html += '<button class="tab-menu-item" data-action="remove-from-group"><i class="bi bi-folder-minus"></i> Remove from Group</button>';
      }
      html += '</div>';
      return html;
    }

    // Create a tab DOM element
    function createTabElement(tab, groupColor) {
      const item = document.createElement('div');
      item.className = 'tab-item' + (tab.id === currentActiveTabId ? ' active' : '');
      if (groupColor) {
        item.style.borderBottomColor = groupColor.border;
        item.classList.add('in-group');
      }
      item.setAttribute('data-tab-id', tab.id);
      item.setAttribute('role', 'tab');
      item.setAttribute('aria-selected', tab.id === currentActiveTabId ? 'true' : 'false');
      item.setAttribute('draggable', 'true');

      const titleSpan = document.createElement('span');
      titleSpan.className = 'tab-title';
      titleSpan.textContent = tab.title || 'Untitled';
      
      titleSpan.ondblclick = (e) => {
        e.stopPropagation();
        startInlineRename(titleSpan, tab.title || 'Untitled', async (newName) => {
          if (newName && newName !== tab.title) {
            if (localVaultMode && tab.handle) {
              const entry = {
                 name: tab.id.split('/').pop(),
                 handle: tab.handle,
                 path: tab.id,
                 parentDir: vaultDirHandle // approximation for root, not perfect for deep files.
              };
              // Note: Native File Renaming only safely supported at Root with approximation,
              // For full support, tab.parentDir must be stored inside openVaultFile.
              // To prevent bugs, we'll just fall back to standard Virtual Title change if parentDir isn't found
            }
            tab.title = newName;
            saveTabsToStorage(tabs);
            renderTabBar(tabs, currentActiveTabId);
          } else {
            renderTabBar(tabs, currentActiveTabId);
          }
        });
      };
      titleSpan.title = tab.title || 'Untitled';

      const menuBtn = document.createElement('button');
      menuBtn.className = 'tab-menu-btn';
      menuBtn.setAttribute('aria-label', 'File options');
      menuBtn.title = 'File options';
      menuBtn.innerHTML = '&#8943;';

      const dropdown = document.createElement('div');
      dropdown.className = 'tab-menu-dropdown';
      dropdown.innerHTML =
        '<button class="tab-menu-item" data-action="pin"><i class="bi bi-pin"></i> <span class="pin-label">' + (tab.pinned ? 'Unpin' : 'Pin') + '</span></button>' +
        '<button class="tab-menu-item" data-action="tag"><i class="bi bi-tag"></i> Tag</button>' +
        '<button class="tab-menu-item tab-menu-item-has-sub" data-action="group-menu"><i class="bi bi-collection"></i> Group <i class="bi bi-chevron-right" style="font-size:10px;margin-left:auto"></i></button>' +
        '<div class="tab-ctx-divider"></div>' +
        '<button class="tab-menu-item" data-action="rename"><i class="bi bi-pencil"></i> Rename</button>' +
        '<button class="tab-menu-item" data-action="duplicate"><i class="bi bi-files"></i> Duplicate</button>' +
        '<button class="tab-menu-item tab-menu-item-danger" data-action="delete"><i class="bi bi-trash"></i> Delete</button>';

      // Group submenu container
      const groupSubContainer = document.createElement('div');
      groupSubContainer.className = 'tab-group-sub-container';
      groupSubContainer.style.display = 'none';
      groupSubContainer.innerHTML = buildGroupSubmenu(tab.groupId);
      dropdown.appendChild(groupSubContainer);

      menuBtn.appendChild(dropdown);

      // Show/hide group submenu on hover
      const groupMenuItem = dropdown.querySelector('[data-action="group-menu"]');
      if (groupMenuItem) {
        groupMenuItem.addEventListener('mouseenter', () => {
          groupSubContainer.style.display = 'block';
          // Position submenu
          const rect = groupMenuItem.getBoundingClientRect();
          groupSubContainer.style.top = (rect.top) + 'px';
          groupSubContainer.style.left = (rect.left - 8) + 'px';
        });
        groupMenuItem.addEventListener('click', (e) => {
          e.stopPropagation();
          groupSubContainer.style.display = groupSubContainer.style.display === 'none' ? 'block' : 'none';
        });
      }
      dropdown.addEventListener('mouseleave', () => {
        groupSubContainer.style.display = 'none';
      });

      // Group submenu actions
      groupSubContainer.querySelectorAll('.tab-menu-item').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          menuBtn.classList.remove('open');
          const action = btn.dataset.action;
          if (action === 'new-group') {
            const name = prompt('Group name:');
            if (name === null) return;
            const group = createGroup(name, 'purple');
            addTabToGroup(tab.id, group.id);
          } else if (action === 'add-to-group') {
            addTabToGroup(tab.id, btn.dataset.groupId);
          } else if (action === 'remove-from-group') {
            removeTabFromGroup(tab.id);
          }
        });
      });

      menuBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        document.querySelectorAll('.tab-menu-btn.open').forEach(function(btn) {
          if (btn !== menuBtn) btn.classList.remove('open');
        });
        menuBtn.classList.toggle('open');
        if (menuBtn.classList.contains('open')) {
          var rect = menuBtn.getBoundingClientRect();
          dropdown.style.top = (rect.bottom + 4) + 'px';
          dropdown.style.right = (window.innerWidth - rect.right) + 'px';
          dropdown.style.left = 'auto';
        }
      });

      dropdown.querySelectorAll(':scope > .tab-menu-item').forEach(function(actionBtn) {
        actionBtn.addEventListener('click', function(e) {
          e.stopPropagation();
          const action = actionBtn.dataset.action;
          if (action === 'group-menu') return; // handled separately
          menuBtn.classList.remove('open');
          if (action === 'rename') renameTab(tab.id);
          else if (action === 'duplicate') duplicateTab(tab.id);
          else if (action === 'delete') deleteTab(tab.id);
          else if (action === 'pin') togglePinTab(tab.id);
          else if (action === 'tag') promptTagTab(tab.id);
        });
      });

      item.appendChild(titleSpan);
      item.appendChild(menuBtn);

      item.addEventListener('click', function() { switchTab(tab.id); });

      item.addEventListener('dragstart', function() {
        draggedTabId = tab.id;
        setTimeout(function() { item.classList.add('dragging'); }, 0);
      });
      item.addEventListener('dragend', function() {
        item.classList.remove('dragging');
        draggedTabId = null;
      });
      item.addEventListener('dragover', function(e) {
        e.preventDefault();
        item.classList.add('drag-over');
      });
      item.addEventListener('dragleave', function() {
        item.classList.remove('drag-over');
      });
      item.addEventListener('drop', function(e) {
        e.preventDefault();
        item.classList.remove('drag-over');
        if (!draggedTabId || draggedTabId === tab.id) return;
        const fromIdx = tabs.findIndex(t => t.id === draggedTabId);
        const toIdx = tabs.findIndex(t => t.id === tab.id);
        if (fromIdx === -1 || toIdx === -1) return;
        const moved = tabs.splice(fromIdx, 1)[0];
        // If dropping onto a grouped tab, add to that group
        if (tab.groupId) moved.groupId = tab.groupId;
        tabs.splice(toIdx, 0, moved);
        saveTabsToStorage(tabs);
        renderTabBar(tabs, activeTabId);
      });

      return item;
    }

    // Create group header element
    function createGroupHeader(group) {
      const gc = getGroupColor(group.color);
      const header = document.createElement('div');
      header.className = 'tab-group-header' + (group.collapsed ? ' collapsed' : '');
      header.style.setProperty('--group-color', gc.border);
      header.style.setProperty('--group-bg', gc.bg);
      header.setAttribute('data-group-id', group.id);

      header.innerHTML =
        '<span class="group-color-dot" style="background:' + gc.dot + '"></span>' +
        '<span class="group-header-name">' + (group.name || 'Unnamed') + '</span>' +
        '<span class="group-collapse-icon"><i class="bi bi-chevron-' + (group.collapsed ? 'right' : 'down') + '"></i></span>';

      // Click to collapse/expand
      header.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleGroupCollapse(group.id);
      });

      // Double-click to rename
      header.addEventListener('dblclick', (e) => {
        e.stopPropagation();
        renameGroup(group.id);
      });

      // Right-click context menu for group
      header.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        e.stopPropagation();
        // Remove existing group context menus
        document.querySelectorAll('.group-context-menu').forEach(m => m.remove());
        const menu = document.createElement('div');
        menu.className = 'group-context-menu';
        menu.innerHTML =
          '<button data-action="rename"><i class="bi bi-pencil"></i> Rename</button>' +
          '<div class="tab-ctx-divider"></div>' +
          '<div class="group-color-picker">' +
            GROUP_COLORS.map(c => '<span class="group-color-option' + (c.name === group.color ? ' active' : '') + '" data-color="' + c.name + '" style="background:' + c.dot + '"></span>').join('') +
          '</div>' +
          '<div class="tab-ctx-divider"></div>' +
          '<button class="tab-menu-item-danger" data-action="ungroup"><i class="bi bi-folder-minus"></i> Ungroup All</button>' +
          '<button class="tab-menu-item-danger" data-action="delete-group"><i class="bi bi-trash"></i> Delete Group</button>';

        menu.style.position = 'fixed';
        menu.style.top = e.clientY + 'px';
        menu.style.left = e.clientX + 'px';
        document.body.appendChild(menu);

        menu.querySelectorAll('button').forEach(btn => {
          btn.addEventListener('click', (ev) => {
            ev.stopPropagation();
            menu.remove();
            const act = btn.dataset.action;
            if (act === 'rename') renameGroup(group.id);
            else if (act === 'ungroup') deleteGroup(group.id);
            else if (act === 'delete-group') {
              // Delete group AND close its tabs
              const groupTabs = tabs.filter(t => t.groupId === group.id);
              groupTabs.forEach(t => deleteTab(t.id));
              tabGroups = tabGroups.filter(g => g.id !== group.id);
              saveGroups();
              renderTabBar(tabs, activeTabId);
            }
          });
        });

        menu.querySelectorAll('.group-color-option').forEach(opt => {
          opt.addEventListener('click', (ev) => {
            ev.stopPropagation();
            menu.remove();
            changeGroupColor(group.id, opt.dataset.color);
          });
        });

        // Close on click outside
        const closeMenu = () => { menu.remove(); document.removeEventListener('click', closeMenu); };
        setTimeout(() => document.addEventListener('click', closeMenu), 0);
      });

      // Drop onto group header = add to group
      header.addEventListener('dragover', (e) => {
        e.preventDefault();
        header.classList.add('drag-over');
      });
      header.addEventListener('dragleave', () => {
        header.classList.remove('drag-over');
      });
      header.addEventListener('drop', (e) => {
        e.preventDefault();
        header.classList.remove('drag-over');
        if (draggedTabId) {
          addTabToGroup(draggedTabId, group.id);
        }
      });

      return header;
    }

    // Render: groups first, then ungrouped tabs
    tabGroups.forEach(group => {
      const groupTabs = tabsArr.filter(t => t.groupId === group.id);
      if (groupTabs.length === 0) return; // skip empty groups

      const gc = getGroupColor(group.color);
      tabList.appendChild(createGroupHeader(group));

      if (!group.collapsed) {
        groupTabs.forEach(tab => {
          tabList.appendChild(createTabElement(tab, gc));
        });
      }
    });

    // Ungrouped tabs
    const ungroupedTabs = tabsArr.filter(t => !t.groupId || !tabGroups.some(g => g.id === t.groupId));
    ungroupedTabs.forEach(tab => {
      tabList.appendChild(createTabElement(tab, null));
    });

    // "+" button
    const newBtn = document.createElement('button');
    newBtn.className = 'tab-new-btn';
    newBtn.title = 'New Tab (Ctrl+T)';
    newBtn.setAttribute('aria-label', 'Open new tab');
    newBtn.innerHTML = '<i class="bi bi-plus-lg"></i>';
    newBtn.addEventListener('click', function() { newTab(); });
    tabList.appendChild(newBtn);

    // Auto-scroll active tab into view
    const activeItem = tabList.querySelector('.tab-item.active');
    if (activeItem) {
      activeItem.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }

    renderMobileTabList(tabsArr, currentActiveTabId);
  }

  function renderMobileTabList(tabsArr, currentActiveTabId) {
    const mobileTabList = document.getElementById('mobile-tab-list');
    if (!mobileTabList) return;
    mobileTabList.innerHTML = '';
    tabsArr.forEach(function(tab) {
      const item = document.createElement('div');
      item.className = 'mobile-tab-item' + (tab.id === currentActiveTabId ? ' active' : '');
      item.setAttribute('role', 'tab');
      item.setAttribute('aria-selected', tab.id === currentActiveTabId ? 'true' : 'false');
      item.setAttribute('data-tab-id', tab.id);

      const titleSpan = document.createElement('span');
      titleSpan.className = 'mobile-tab-title';
      titleSpan.textContent = tab.title || 'Untitled';
      titleSpan.title = tab.title || 'Untitled';

      // Three-dot menu button (same as desktop)
      const menuBtn = document.createElement('button');
      menuBtn.className = 'tab-menu-btn';
      menuBtn.setAttribute('aria-label', 'File options');
      menuBtn.title = 'File options';
      menuBtn.innerHTML = '&#8943;';

      // Dropdown (same as desktop)
      const dropdown = document.createElement('div');
      dropdown.className = 'tab-menu-dropdown';
      dropdown.innerHTML =
        '<button class="tab-menu-item" data-action="rename"><i class="bi bi-pencil"></i> Rename</button>' +
        '<button class="tab-menu-item" data-action="duplicate"><i class="bi bi-files"></i> Duplicate</button>' +
        '<button class="tab-menu-item tab-menu-item-danger" data-action="delete"><i class="bi bi-trash"></i> Delete</button>';

      menuBtn.appendChild(dropdown);

      menuBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        document.querySelectorAll('.tab-menu-btn.open').forEach(function(btn) {
          if (btn !== menuBtn) btn.classList.remove('open');
        });
        menuBtn.classList.toggle('open');
        if (menuBtn.classList.contains('open')) {
          const rect = menuBtn.getBoundingClientRect();
          dropdown.style.top = (rect.bottom + 4) + 'px';
          dropdown.style.right = (window.innerWidth - rect.right) + 'px';
          dropdown.style.left = 'auto';
        }
      });

      dropdown.querySelectorAll('.tab-menu-item').forEach(function(actionBtn) {
        actionBtn.addEventListener('click', function(e) {
          e.stopPropagation();
          menuBtn.classList.remove('open');
          const action = actionBtn.getAttribute('data-action');
          if (action === 'rename') {
            closeMobileMenu();
            renameTab(tab.id);
          } else if (action === 'duplicate') {
            duplicateTab(tab.id);
            closeMobileMenu();
          } else if (action === 'delete') {
            deleteTab(tab.id);
          }
        });
      });

      item.appendChild(titleSpan);
      item.appendChild(menuBtn);

      item.addEventListener('click', function() {
        switchTab(tab.id);
        closeMobileMenu();
      });

      mobileTabList.appendChild(item);
    });
  }

  // Close any open tab dropdown when clicking elsewhere in the document
  document.addEventListener('click', function() {
    document.querySelectorAll('.tab-menu-btn.open').forEach(function(btn) {
      btn.classList.remove('open');
    });
  });

  async function saveCurrentTabState() {
    const tab = tabs.find(function(t) { return t.id === activeTabId; });
    if (!tab) return;
    tab.content = markdownEditor.value;
    tab.scrollPos = markdownEditor.scrollTop;
    tab.viewMode = currentViewMode || 'split';
    
    if (tab.handle) {
      try {
        const writable = await tab.handle.createWritable();
        await writable.write(tab.content);
        await writable.close();
        if (vaultMiniSearch) {
          vaultMiniSearch.add({ id: tab.id, title: tab.title, path: tab.path, content: tab.content });
        }
      } catch(e) {
        console.error('Failed to write cleanly to vault:', e);
      }
    } else {
      saveTabsToStorage(tabs);
    }
  }

  function restoreViewMode(mode) {
    currentViewMode = null;
    setViewMode(mode || 'split');
  }

  async function switchTab(tabId) {
    if (tabId === activeTabId && !localVaultMode) return;
    await saveCurrentTabState();
    activeTabId = tabId;
    saveActiveTabId(activeTabId);
    const tab = tabs.find(function(t) { return t.id === tabId; });
    if (!tab) return;
    
    if (tab.handle && !tab.content) {
      try {
        const file = await tab.handle.getFile();
        tab.content = await file.text();
      } catch(e) {
        tab.content = 'Error reading file';
      }
    }
    
    markdownEditor.value = tab.content || '';
    restoreViewMode(tab.viewMode);
    renderMarkdown();
    requestAnimationFrame(function() {
      markdownEditor.scrollTop = tab.scrollPos || 0;
    });
    renderTabBar(tabs, activeTabId);
  }

  function newTab(content, title) {
    if (content === undefined) content = '';
    if (!title) title = nextUntitledTitle();
    const tab = createTab(content, title);
    tabs.push(tab);
    switchTab(tab.id);
    markdownEditor.focus();
  }

  function closeTab(tabId) {
    const idx = tabs.findIndex(function(t) { return t.id === tabId; });
    if (idx === -1) return;
    tabs.splice(idx, 1);
    if (tabs.length === 0) {
      // Auto-create new "Untitled" when last tab is deleted
      const newT = createTab('', nextUntitledTitle());
      tabs.push(newT);
      activeTabId = newT.id;
      saveActiveTabId(activeTabId);
      markdownEditor.value = '';
      restoreViewMode('split');
      renderMarkdown();
    } else if (activeTabId === tabId) {
      const newIdx = Math.max(0, idx - 1);
      activeTabId = tabs[newIdx].id;
      saveActiveTabId(activeTabId);
      const newActiveTab = tabs[newIdx];
      markdownEditor.value = newActiveTab.content;
      restoreViewMode(newActiveTab.viewMode);
      renderMarkdown();
      requestAnimationFrame(function() {
        markdownEditor.scrollTop = newActiveTab.scrollPos || 0;
      });
    }
    saveTabsToStorage(tabs);
    renderTabBar(tabs, activeTabId);
  }

  function deleteTab(tabId) {
    closeTab(tabId);
  }

  function renameTab(tabId) {
    const tab = tabs.find(function(t) { return t.id === tabId; });
    if (!tab) return;
    const modal = document.getElementById('rename-modal');
    const input = document.getElementById('rename-modal-input');
    const confirmBtn = document.getElementById('rename-modal-confirm');
    const cancelBtn = document.getElementById('rename-modal-cancel');
    if (!modal || !input) return;
    input.value = tab.title;
    modal.style.display = 'flex';
    input.focus();
    input.select();

    function doRename() {
      const newName = input.value.trim();
      if (newName) {
        tab.title = newName;
        saveTabsToStorage(tabs);
        renderTabBar(tabs, activeTabId);
      }
      modal.style.display = 'none';
      cleanup();
    }

    function cleanup() {
      confirmBtn.removeEventListener('click', doRename);
      cancelBtn.removeEventListener('click', doCancel);
      input.removeEventListener('keydown', onKey);
    }

    function doCancel() {
      modal.style.display = 'none';
      cleanup();
    }

    function onKey(e) {
      if (e.key === 'Enter') doRename();
      else if (e.key === 'Escape') doCancel();
    }

    confirmBtn.addEventListener('click', doRename);
    cancelBtn.addEventListener('click', doCancel);
    input.addEventListener('keydown', onKey);
  }

  function duplicateTab(tabId) {
    const tab = tabs.find(function(t) { return t.id === tabId; });
    if (!tab) return;
    saveCurrentTabState();
    const dupTitle = tab.title + ' (copy)';
    const dup = createTab(tab.content, dupTitle, tab.viewMode);
    if (tab.groupId) dup.groupId = tab.groupId;
    const idx = tabs.findIndex(function(t) { return t.id === tabId; });
    tabs.splice(idx + 1, 0, dup);
    switchTab(dup.id);
  }

  function resetAllTabs() {
    const modal = document.getElementById('reset-confirm-modal');
    const confirmBtn = document.getElementById('reset-modal-confirm');
    const cancelBtn = document.getElementById('reset-modal-cancel');
    if (!modal) return;
    modal.style.display = 'flex';

    function doReset() {
      modal.style.display = 'none';
      cleanup();
      tabs = [];
      untitledCounter = 0;
      saveUntitledCounter(0);
      const welcome = createTab(sampleMarkdown, 'Welcome to Markdown');
      tabs.push(welcome);
      activeTabId = welcome.id;
      saveActiveTabId(activeTabId);
      saveTabsToStorage(tabs);
      markdownEditor.value = sampleMarkdown;
      restoreViewMode('split');
      renderMarkdown();
      renderTabBar(tabs, activeTabId);
    }

    function doCancel() {
      modal.style.display = 'none';
      cleanup();
    }

    function cleanup() {
      confirmBtn.removeEventListener('click', doReset);
      cancelBtn.removeEventListener('click', doCancel);
    }

    confirmBtn.addEventListener('click', doReset);
    cancelBtn.addEventListener('click', doCancel);
  }

  async function initTabs() {
    await migrateFromLocalStorage();
    await initHistory();
    tabGroups = await loadGroups();
    
    // Check if there is an active Vault handle
    const storedHandle = await localforage.getItem(VAULT_HANDLE_KEY);
    if (storedHandle) {
      await initVault(storedHandle);
      // initVault completely overtakes the UI, so we can return early or just skip virtual tabs setup
    }
    
    untitledCounter = await loadUntitledCounter();
    tabs = await loadTabsFromStorage();
    activeTabId = await loadActiveTabId();
    if (!localVaultMode) {
      if (tabs.length === 0) {
        const tab = createTab(sampleMarkdown, 'Welcome to Markdown');
        tabs.push(tab);
        activeTabId = tab.id;
        saveTabsToStorage(tabs);
        saveActiveTabId(activeTabId);
      } else if (!tabs.find(function(t) { return t.id === activeTabId; })) {
        activeTabId = tabs[0].id;
        saveActiveTabId(activeTabId);
      }

      // Check for share hash BEFORE restoring the active tab content
      // This prevents the active tab from overwriting shared content
      const shareContent = decodeShareHash();
      if (shareContent !== null) {
        const shareTab = createTab(shareContent, 'Shared Note');
        tabs.push(shareTab);
        activeTabId = shareTab.id;
        markdownEditor.value = shareContent;
        restoreViewMode('split');
        saveTabsToStorage(tabs);
        saveActiveTabId(activeTabId);
      } else {
        const activeTab = tabs.find(function(t) { return t.id === activeTabId; });
        if (activeTab) {
          markdownEditor.value = activeTab.content || '';
          restoreViewMode(activeTab.viewMode);
        }
      }
    }
    
    // Always render markdown and trigger updates
    renderMarkdown();
    requestAnimationFrame(function() {
      if (!localVaultMode) {
        const activeTab = tabs.find(function(t) { return t.id === activeTabId; });
        if (activeTab) markdownEditor.scrollTop = activeTab.scrollPos || 0;
      }
    });
    renderTabBar(tabs, activeTabId);
  }

  function renderMarkdown() {
    try {
      const markdown = markdownEditor.value;
      const html = marked.parse(markdown);
      const sanitizedHtml = DOMPurify.sanitize(html, {
        ADD_TAGS: ['mjx-container'],
        ADD_ATTR: ['id', 'class', 'style']
      });
      markdownPreview.innerHTML = sanitizedHtml;

      processEmojis(markdownPreview);
      
      // Reinitialize mermaid with current theme before rendering diagrams
      initMermaid();
      
      try {
        const mermaidNodes = markdownPreview.querySelectorAll('.mermaid');
        if (mermaidNodes.length > 0) {
          mermaidNodes.forEach(node => {
            if (node.innerHTML.includes('\\n')) {
              node.innerHTML = node.innerHTML.replace(/\\n/g, '<br/>');
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
            console.warn('MathJax typesetting failed:', err);
          });
        } catch (e) {
          console.warn("MathJax rendering failed:", e);
        }
      }

      updateDocumentStats();
    } catch (e) {
      console.error("Markdown rendering failed:", e);
      markdownPreview.innerHTML = `<div class="alert alert-danger">
              <strong>Error rendering markdown:</strong> ${e.message}
          </div>
          <pre>${markdownEditor.value}</pre>`;
    }
  }

  function importMarkdownFile(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      newTab(e.target.result, file.name.replace(/\.md$/i, ''));
      dropzone.style.display = "none";
    };
    reader.readAsText(file);
  }

  function processEmojis(element) {
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );
    
    const textNodes = [];
    let node;
    while ((node = walker.nextNode())) {
      let parent = node.parentNode;
      let isInCode = false;
      while (parent && parent !== element) {
        if (parent.tagName === 'PRE' || parent.tagName === 'CODE') {
          isInCode = true;
          break;
        }
        parent = parent.parentNode;
      }
      
      if (!isInCode && node.nodeValue.includes(':')) {
        textNodes.push(node);
      }
    }
    
    textNodes.forEach(textNode => {
      const text = textNode.nodeValue;
      const emojiRegex = /:([\w+-]+):/g;
      
      let match;
      let lastIndex = 0;
      let result = '';
      let hasEmoji = false;
      
      while ((match = emojiRegex.exec(text)) !== null) {
        const shortcode = match[1];
        const emoji = joypixels.shortnameToUnicode(`:${shortcode}:`);
        
        if (emoji !== `:${shortcode}:`) { // If conversion was successful
          hasEmoji = true;
          result += text.substring(lastIndex, match.index) + emoji;
          lastIndex = emojiRegex.lastIndex;
        } else {
          result += text.substring(lastIndex, emojiRegex.lastIndex);
          lastIndex = emojiRegex.lastIndex;
        }
      }
      
      if (hasEmoji) {
        result += text.substring(lastIndex);
        const span = document.createElement('span');
        span.innerHTML = result;
        textNode.parentNode.replaceChild(span, textNode);
      }
    });
  }

  function debouncedRender() {
    clearTimeout(markdownRenderTimeout);
    markdownRenderTimeout = setTimeout(renderMarkdown, RENDER_DELAY);
  }

  function updateDocumentStats() {
    const text = markdownEditor.value;

    const charCount = text.length;
    charCountElement.textContent = charCount.toLocaleString();

    const wordCount = text.trim() === "" ? 0 : text.trim().split(/\s+/).length;
    wordCountElement.textContent = wordCount.toLocaleString();

    const readingTimeMinutes = Math.ceil(wordCount / 200);
    readingTimeElement.textContent = readingTimeMinutes;
  }

  function syncEditorToPreview() {
    if (!syncScrollingEnabled || isPreviewScrolling) return;

    isEditorScrolling = true;
    clearTimeout(scrollSyncTimeout);

    scrollSyncTimeout = setTimeout(() => {
      const editorScrollRatio =
        editorPane.scrollTop /
        (editorPane.scrollHeight - editorPane.clientHeight);
      const previewScrollPosition =
        (previewPane.scrollHeight - previewPane.clientHeight) *
        editorScrollRatio;

      if (!isNaN(previewScrollPosition) && isFinite(previewScrollPosition)) {
        previewPane.scrollTop = previewScrollPosition;
      }

      setTimeout(() => {
        isEditorScrolling = false;
      }, 50);
    }, SCROLL_SYNC_DELAY);
  }

  function syncPreviewToEditor() {
    if (!syncScrollingEnabled || isEditorScrolling) return;

    isPreviewScrolling = true;
    clearTimeout(scrollSyncTimeout);

    scrollSyncTimeout = setTimeout(() => {
      const previewScrollRatio =
        previewPane.scrollTop /
        (previewPane.scrollHeight - previewPane.clientHeight);
      const editorScrollPosition =
        (editorPane.scrollHeight - editorPane.clientHeight) *
        previewScrollRatio;

      if (!isNaN(editorScrollPosition) && isFinite(editorScrollPosition)) {
        editorPane.scrollTop = editorScrollPosition;
      }

      setTimeout(() => {
        isPreviewScrolling = false;
      }, 50);
    }, SCROLL_SYNC_DELAY);
  }

  function toggleSyncScrolling() {
    syncScrollingEnabled = !syncScrollingEnabled;
    if (syncScrollingEnabled) {
      toggleSyncButton.innerHTML = '<i class="bi bi-link-45deg"></i> Sync Off';
      toggleSyncButton.classList.add("sync-disabled");
      toggleSyncButton.classList.remove("sync-enabled");
      toggleSyncButton.classList.add("border-primary");
    } else {
      toggleSyncButton.innerHTML = '<i class="bi bi-link"></i> Sync On';
      toggleSyncButton.classList.add("sync-enabled");
      toggleSyncButton.classList.remove("sync-disabled");
      toggleSyncButton.classList.remove("border-primary");
    }
  }

  // View Mode Functions - Story 1.1 & 1.2
  function setViewMode(mode) {
    if (!mode || !['editor', 'split', 'preview'].includes(mode)) return;
    if (mode === currentViewMode) return;

    const previousMode = currentViewMode;
    currentViewMode = mode;

    // Update content container class
    contentContainer.classList.remove('view-editor-only', 'view-preview-only', 'view-split');
    contentContainer.classList.add('view-' + (mode === 'editor' ? 'editor-only' : mode === 'preview' ? 'preview-only' : 'split'));

    // Update button active states (desktop)
    viewModeButtons.forEach(btn => {
      const btnMode = btn.getAttribute('data-mode');
      if (btnMode === mode) {
        btn.classList.add('active');
        btn.setAttribute('aria-pressed', 'true');
      } else {
        btn.classList.remove('active');
        btn.setAttribute('aria-pressed', 'false');
      }
    });

    // Story 1.4: Update mobile button active states
    mobileViewModeButtons.forEach(btn => {
      const btnMode = btn.getAttribute('data-mode');
      if (btnMode === mode) {
        btn.classList.add('active');
        btn.setAttribute('aria-pressed', 'true');
      } else {
        btn.classList.remove('active');
        btn.setAttribute('aria-pressed', 'false');
      }
    });

    // Story 1.2: Show/hide sync toggle based on view mode
    updateSyncToggleVisibility(mode);

    // Story 1.3: Handle pane widths when switching modes
    if (mode === 'split') {
      // Restore preserved pane widths when entering split mode
      applyPaneWidths();
    } else if (previousMode === 'split') {
      // Reset pane widths when leaving split mode
      resetPaneWidths();
    }

    // Re-render markdown when switching to a view that includes preview
    if (mode === 'split' || mode === 'preview') {
      renderMarkdown();
    }
  }

  // Story 1.2: Update sync toggle visibility
  function updateSyncToggleVisibility(mode) {
    const isSplitView = mode === 'split';

    // Desktop sync toggle
    if (toggleSyncButton) {
      toggleSyncButton.style.display = isSplitView ? '' : 'none';
      toggleSyncButton.setAttribute('aria-hidden', !isSplitView);
    }

    // Mobile sync toggle
    if (mobileToggleSync) {
      mobileToggleSync.style.display = isSplitView ? '' : 'none';
      mobileToggleSync.setAttribute('aria-hidden', !isSplitView);
    }
  }

  // Story 1.3: Resize Divider Functions
  function initResizer() {
    if (!resizeDivider) return;

    resizeDivider.addEventListener('mousedown', startResize);
    document.addEventListener('mousemove', handleResize);
    document.addEventListener('mouseup', stopResize);

    // Touch support for tablets (though disabled via CSS, keeping for future)
    resizeDivider.addEventListener('touchstart', startResizeTouch);
    document.addEventListener('touchmove', handleResizeTouch);
    document.addEventListener('touchend', stopResize);
  }

  function startResize(e) {
    if (currentViewMode !== 'split') return;
    e.preventDefault();
    isResizing = true;
    resizeDivider.classList.add('dragging');
    document.body.classList.add('resizing');
  }

  function startResizeTouch(e) {
    if (currentViewMode !== 'split') return;
    e.preventDefault();
    isResizing = true;
    resizeDivider.classList.add('dragging');
    document.body.classList.add('resizing');
  }

  function handleResize(e) {
    if (!isResizing) return;

    const containerRect = contentContainer.getBoundingClientRect();
    const containerWidth = containerRect.width;
    const mouseX = e.clientX - containerRect.left;

    // Calculate percentage
    let newEditorPercent = (mouseX / containerWidth) * 100;

    // Enforce minimum pane widths
    newEditorPercent = Math.max(MIN_PANE_PERCENT, Math.min(100 - MIN_PANE_PERCENT, newEditorPercent));

    editorWidthPercent = newEditorPercent;
    applyPaneWidths();
  }

  function handleResizeTouch(e) {
    if (!isResizing || !e.touches[0]) return;

    const containerRect = contentContainer.getBoundingClientRect();
    const containerWidth = containerRect.width;
    const touchX = e.touches[0].clientX - containerRect.left;

    let newEditorPercent = (touchX / containerWidth) * 100;
    newEditorPercent = Math.max(MIN_PANE_PERCENT, Math.min(100 - MIN_PANE_PERCENT, newEditorPercent));

    editorWidthPercent = newEditorPercent;
    applyPaneWidths();
  }

  function stopResize() {
    if (!isResizing) return;
    isResizing = false;
    resizeDivider.classList.remove('dragging');
    document.body.classList.remove('resizing');
  }

  function applyPaneWidths() {
    if (currentViewMode !== 'split') return;

    const previewPercent = 100 - editorWidthPercent;
    editorPaneElement.style.flex = `0 0 calc(${editorWidthPercent}% - 4px)`;
    previewPaneElement.style.flex = `0 0 calc(${previewPercent}% - 4px)`;
  }

  function resetPaneWidths() {
    editorPaneElement.style.flex = '';
    previewPaneElement.style.flex = '';
  }

  function openMobileMenu() {
    mobileMenuPanel.classList.add("active");
    mobileMenuOverlay.classList.add("active");
  }
  function closeMobileMenu() {
    mobileMenuPanel.classList.remove("active");
    mobileMenuOverlay.classList.remove("active");
  }
  mobileMenuToggle.addEventListener("click", openMobileMenu);
  mobileCloseMenu.addEventListener("click", closeMobileMenu);
  mobileMenuOverlay.addEventListener("click", closeMobileMenu);

  function updateMobileStats() {
    mobileCharCount.textContent   = charCountElement.textContent;
    mobileWordCount.textContent   = wordCountElement.textContent;
    mobileReadingTime.textContent = readingTimeElement.textContent;
  }

  const origUpdateStats = updateDocumentStats;
  updateDocumentStats = function() {
    origUpdateStats();
    updateMobileStats();
  };

  mobileToggleSync.addEventListener("click", () => {
    toggleSyncScrolling();
    if (syncScrollingEnabled) {
      mobileToggleSync.innerHTML = '<i class="bi bi-link-45deg me-2"></i> Sync Off';
      mobileToggleSync.classList.add("sync-disabled");
      mobileToggleSync.classList.remove("sync-enabled");
      mobileToggleSync.classList.add("border-primary");
    } else {
      mobileToggleSync.innerHTML = '<i class="bi bi-link me-2"></i> Sync On';
      mobileToggleSync.classList.add("sync-enabled");
      mobileToggleSync.classList.remove("sync-disabled");
      mobileToggleSync.classList.remove("border-primary");
    }
  });
  mobileImportBtn.addEventListener("click", () => fileInput.click());
  mobileExportMd.addEventListener("click", () => exportMd.click());
  mobileExportHtml.addEventListener("click", () => exportHtml.click());
  mobileExportPdf.addEventListener("click", () => exportPdf.click());
  mobileCopyMarkdown.addEventListener("click", () => copyMarkdownButton.click());
  mobileThemeToggle.addEventListener("click", () => {
    themeToggle.click();
    mobileThemeToggle.innerHTML = themeToggle.innerHTML + " Toggle Dark Mode";
  });

  const mobileNewTabBtn = document.getElementById("mobile-new-tab-btn");
  if (mobileNewTabBtn) {
    mobileNewTabBtn.addEventListener("click", function() {
      newTab();
      closeMobileMenu();
    });
  }

  const mobileTabResetBtn = document.getElementById("mobile-tab-reset-btn");
  if (mobileTabResetBtn) {
    mobileTabResetBtn.addEventListener("click", function() {
      closeMobileMenu();
      resetAllTabs();
    });
  }
  
  initTabs().then(() => {
    updateMobileStats();
  });

  // Initialize resizer - Story 1.3
  initResizer();

  // View Mode Button Event Listeners - Story 1.1
  viewModeButtons.forEach(btn => {
    btn.addEventListener('click', function() {
      const mode = this.getAttribute('data-mode');
      setViewMode(mode);
      saveCurrentTabState();
    });
  });

  // Story 1.4: Mobile View Mode Button Event Listeners
  mobileViewModeButtons.forEach(btn => {
    btn.addEventListener('click', function() {
      const mode = this.getAttribute('data-mode');
      setViewMode(mode);
      saveCurrentTabState();
      closeMobileMenu();
    });
  });

  let autoSnapshotTimer = null;
  markdownEditor.addEventListener("input", function() {
    debouncedRender();
    clearTimeout(saveTabStateTimeout);
    saveTabStateTimeout = setTimeout(saveCurrentTabState, 500);

    // Auto-snapshot: debounced 5s after stopping typing
    clearTimeout(autoSnapshotTimer);
    autoSnapshotTimer = setTimeout(() => {
      const content = markdownEditor.value;
      if (!content.trim()) return; // skip empty
      const allHistory = loadHistory();
      const tabHistory = allHistory.filter(s => s.tabId === activeTabId);
      const last = tabHistory.length > 0 ? tabHistory[tabHistory.length - 1] : null;
      // Only save if content changed by at least 20 chars or 5% difference
      if (!last || Math.abs(content.length - (last.content || '').length) >= 20) {
        const currentTab = tabs.find(t => t.id === activeTabId);
        saveShareSnapshot(content, currentTab ? currentTab.title : 'Untitled');
      }
    }, 5000);
  });
  
  // Tab key handler to insert indentation instead of moving focus
  markdownEditor.addEventListener("keydown", function(e) {
    if (e.key === 'Tab') {
      e.preventDefault();
      
      const start = this.selectionStart;
      const end = this.selectionEnd;
      const value = this.value;
      
      // Insert 2 spaces
      const indent = '  '; // 2 spaces
      
      // Update textarea value
      this.value = value.substring(0, start) + indent + value.substring(end);
      
      // Update cursor position
      this.selectionStart = this.selectionEnd = start + indent.length;
      
      // Trigger input event to update preview
      this.dispatchEvent(new Event('input'));
    }
  });
  
  editorPane.addEventListener("scroll", syncEditorToPreview);
  previewPane.addEventListener("scroll", syncPreviewToEditor);
  toggleSyncButton.addEventListener("click", toggleSyncScrolling);
  themeToggle.addEventListener("click", function () {
    const theme =
      document.documentElement.getAttribute("data-theme") === "dark"
        ? "light"
        : "dark";
    document.documentElement.setAttribute("data-theme", theme);

    if (theme === "dark") {
      themeToggle.innerHTML = '<i class="bi bi-sun"></i>';
    } else {
      themeToggle.innerHTML = '<i class="bi bi-moon"></i>';
    }
    
    renderMarkdown();
  });

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
    exportSingleFile.addEventListener('click', async function(e) {
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

        // Replace <script src="script.js"> with inline <script>
        doc.querySelectorAll('script[src="script.js"]').forEach(el => {
          const script = doc.createElement('script');
          script.textContent = jsText;
          el.replaceWith(script);
        });

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
  function identifyGraphicElements(container) {
    const graphics = [];

    // Query for images
    container.querySelectorAll('img').forEach(el => {
      graphics.push({ element: el, type: 'img' });
    });

    // Query for SVGs (Mermaid diagrams)
    container.querySelectorAll('svg').forEach(el => {
      graphics.push({ element: el, type: 'svg' });
    });

    // Query for pre elements (code blocks)
    container.querySelectorAll('pre').forEach(el => {
      graphics.push({ element: el, type: 'pre' });
    });

    // Query for tables
    container.querySelectorAll('table').forEach(el => {
      graphics.push({ element: el, type: 'table' });
    });

    return graphics;
  }

  /**
   * Task 2: Calculates element positions relative to the container
   * @param {Array} elements - Array of {element, type} objects
   * @param {HTMLElement} container - The container element
   * @returns {Array} Array with position data added
   */
  function calculateElementPositions(elements, container) {
    const containerRect = container.getBoundingClientRect();

    return elements.map(item => {
      const rect = item.element.getBoundingClientRect();
      const top = rect.top - containerRect.top;
      const height = rect.height;
      const bottom = top + height;

      return {
        element: item.element,
        type: item.type,
        top: top,
        height: height,
        bottom: bottom
      };
    });
  }

  /**
   * Task 3: Calculates page boundary positions
   * @param {number} totalHeight - Total height of content in pixels
   * @param {number} elementWidth - Actual width of the rendered element in pixels
   * @param {Object} pageConfig - Page configuration object
   * @returns {Array} Array of y-coordinates where pages end
   */
  function calculatePageBoundaries(totalHeight, elementWidth, pageConfig) {
    // Calculate pixel height per page based on the element's actual width
    // This must match how PDF pagination will split the canvas
    // The aspect ratio of content area determines page height relative to width
    const aspectRatio = pageConfig.contentHeight / pageConfig.contentWidth;
    const pageHeightPx = elementWidth * aspectRatio;

    const boundaries = [];
    let y = pageHeightPx;

    while (y < totalHeight) {
      boundaries.push(y);
      y += pageHeightPx;
    }

    return { boundaries, pageHeightPx };
  }

  /**
   * Task 4: Detects which elements would be split across page boundaries
   * @param {Array} elements - Array of elements with position data
   * @param {Array} pageBoundaries - Array of page break y-coordinates
   * @returns {Array} Array of split elements with additional split info
   */
  function detectSplitElements(elements, pageBoundaries) {
    // Handle edge case: empty elements array
    if (!elements || elements.length === 0) {
      return [];
    }

    // Handle edge case: no page boundaries (single page)
    if (!pageBoundaries || pageBoundaries.length === 0) {
      return [];
    }

    const splitElements = [];

    for (const item of elements) {
      // Find which page the element starts on
      let startPage = 0;
      for (let i = 0; i < pageBoundaries.length; i++) {
        if (item.top >= pageBoundaries[i]) {
          startPage = i + 1;
        } else {
          break;
        }
      }

      // Find which page the element ends on
      let endPage = 0;
      for (let i = 0; i < pageBoundaries.length; i++) {
        if (item.bottom > pageBoundaries[i]) {
          endPage = i + 1;
        } else {
          break;
        }
      }

      // Element is split if it spans multiple pages
      if (endPage > startPage) {
        // Calculate overflow amount (how much crosses into next page)
        const boundaryY = pageBoundaries[startPage] || pageBoundaries[0];
        const overflowAmount = item.bottom - boundaryY;

        splitElements.push({
          element: item.element,
          type: item.type,
          top: item.top,
          height: item.height,
          splitPageIndex: startPage,
          overflowAmount: overflowAmount
        });
      }
    }

    return splitElements;
  }

  /**
   * Task 5: Main entry point for analyzing graphics for page breaks
   * @param {HTMLElement} tempElement - The rendered content container
   * @returns {Object} Analysis result with totalElements, splitElements, pageCount
   */
  function analyzeGraphicsForPageBreaks(tempElement) {
    try {
      // Step 1: Identify all graphic elements
      const graphics = identifyGraphicElements(tempElement);
      console.log('Step 1 - Graphics found:', graphics.length, graphics.map(g => g.type));

      // Step 2: Calculate positions for each element
      const elementsWithPositions = calculateElementPositions(graphics, tempElement);
      console.log('Step 2 - Element positions:', elementsWithPositions.map(e => ({
        type: e.type,
        top: Math.round(e.top),
        height: Math.round(e.height),
        bottom: Math.round(e.bottom)
      })));

      // Step 3: Calculate page boundaries using the element's ACTUAL width
      const totalHeight = tempElement.scrollHeight;
      const elementWidth = tempElement.offsetWidth;
      const { boundaries: pageBoundaries, pageHeightPx } = calculatePageBoundaries(
        totalHeight,
        elementWidth,
        PAGE_CONFIG
      );

      console.log('Step 3 - Page boundaries:', {
        elementWidth,
        totalHeight,
        pageHeightPx: Math.round(pageHeightPx),
        boundaries: pageBoundaries.map(b => Math.round(b))
      });

      // Step 4: Detect split elements
      const splitElements = detectSplitElements(elementsWithPositions, pageBoundaries);
      console.log('Step 4 - Split elements detected:', splitElements.length);

      // Calculate page count
      const pageCount = pageBoundaries.length + 1;

      return {
        totalElements: graphics.length,
        splitElements: splitElements,
        pageCount: pageCount,
        pageBoundaries: pageBoundaries,
        pageHeightPx: pageHeightPx
      };
    } catch (error) {
      console.error('Page-break analysis failed:', error);
      return {
        totalElements: 0,
        splitElements: [],
        pageCount: 1,
        pageBoundaries: [],
        pageHeightPx: 0
      };
    }
  }

  // ============================================
  // End Page-Break Detection Functions
  // ============================================

  // ============================================
  // Page-Break Insertion Functions (Story 1.2)
  // ============================================

  // Threshold for whitespace optimization (30% of page height)
  const PAGE_BREAK_THRESHOLD = 0.3;

  /**
   * Task 3: Categorizes split elements by whether they fit on a single page
   * @param {Array} splitElements - Array of split elements from detection
   * @param {number} pageHeightPx - Page height in pixels
   * @returns {Object} { fittingElements, oversizedElements }
   */
  function categorizeBySize(splitElements, pageHeightPx) {
    const fittingElements = [];
    const oversizedElements = [];

    for (const item of splitElements) {
      if (item.height <= pageHeightPx) {
        fittingElements.push(item);
      } else {
        oversizedElements.push(item);
      }
    }

    return { fittingElements, oversizedElements };
  }

  /**
   * Task 1: Inserts page breaks by adjusting margins for fitting elements
   * @param {Array} fittingElements - Elements that fit on a single page
   * @param {number} pageHeightPx - Page height in pixels
   */
  function insertPageBreaks(fittingElements, pageHeightPx) {
    for (const item of fittingElements) {
      // Calculate where the current page ends
      const currentPageBottom = (item.splitPageIndex + 1) * pageHeightPx;

      // Calculate remaining space on current page
      const remainingSpace = currentPageBottom - item.top;
      const remainingRatio = remainingSpace / pageHeightPx;

      console.log('Processing split element:', {
        type: item.type,
        top: Math.round(item.top),
        height: Math.round(item.height),
        splitPageIndex: item.splitPageIndex,
        currentPageBottom: Math.round(currentPageBottom),
        remainingSpace: Math.round(remainingSpace),
        remainingRatio: remainingRatio.toFixed(2)
      });

      // Task 4: Whitespace optimization
      // If remaining space is more than threshold and element almost fits, skip
      // (Will be handled by Story 1.3 scaling instead)
      if (remainingRatio > PAGE_BREAK_THRESHOLD) {
        const scaledHeight = item.height * 0.9; // 90% scale
        if (scaledHeight <= remainingSpace) {
          console.log('  -> Skipping (can fit with 90% scaling)');
          continue;
        }
      }

      // Calculate margin needed to push element to next page
      const marginNeeded = currentPageBottom - item.top + 5; // 5px buffer

      console.log('  -> Applying marginTop:', marginNeeded, 'px');

      // Determine which element to apply margin to
      // For SVG elements (Mermaid diagrams), apply to parent container for proper layout
      let targetElement = item.element;
      if (item.type === 'svg' && item.element.parentElement) {
        targetElement = item.element.parentElement;
        console.log('  -> Using parent element:', targetElement.tagName, targetElement.className);
      }

      // Apply margin to push element to next page
      const currentMargin = parseFloat(targetElement.style.marginTop) || 0;
      targetElement.style.marginTop = `${currentMargin + marginNeeded}px`;

      console.log('  -> Element after margin:', targetElement.tagName, 'marginTop =', targetElement.style.marginTop);
    }
  }

  /**
   * Task 2: Applies page breaks with cascading adjustment handling
   * @param {HTMLElement} tempElement - The rendered content container
   * @param {Object} pageConfig - Page configuration object (unused, kept for API compatibility)
   * @param {number} maxIterations - Maximum iterations to prevent infinite loops
   * @returns {Object} Final analysis result
   */
  function applyPageBreaksWithCascade(tempElement, pageConfig, maxIterations = 10) {
    let iteration = 0;
    let analysis;
    let previousSplitCount = -1;

    do {
      // Re-analyze after each adjustment
      analysis = analyzeGraphicsForPageBreaks(tempElement);

      // Use pageHeightPx from analysis (calculated from actual element width)
      const pageHeightPx = analysis.pageHeightPx;

      // Categorize elements by size
      const { fittingElements, oversizedElements } = categorizeBySize(
        analysis.splitElements,
        pageHeightPx
      );

      // Store oversized elements for Story 1.3
      analysis.oversizedElements = oversizedElements;

      // If no fitting elements need adjustment, we're done
      if (fittingElements.length === 0) {
        break;
      }

      // Check if we're making progress (prevent infinite loops)
      if (fittingElements.length === previousSplitCount) {
        console.warn('Page-break adjustment not making progress, stopping');
        break;
      }
      previousSplitCount = fittingElements.length;

      // Apply page breaks to fitting elements
      insertPageBreaks(fittingElements, pageHeightPx);
      iteration++;

    } while (iteration < maxIterations);

    if (iteration >= maxIterations) {
      console.warn('Page-break stabilization reached max iterations:', maxIterations);
    }

    console.log('Page-break cascade complete:', {
      iterations: iteration,
      finalSplitCount: analysis.splitElements.length,
      oversizedCount: analysis.oversizedElements ? analysis.oversizedElements.length : 0
    });

    return analysis;
  }

  // ============================================
  // End Page-Break Insertion Functions
  // ============================================

  // ============================================
  // Oversized Graphics Scaling Functions (Story 1.3)
  // ============================================

  // Minimum scale factor to maintain readability (50%)
  const MIN_SCALE_FACTOR = 0.5;

  /**
   * Task 1 & 2: Calculates scale factor with minimum enforcement
   * @param {number} elementHeight - Original height of element in pixels
   * @param {number} availableHeight - Available page height in pixels
   * @param {number} buffer - Small buffer to prevent edge overflow
   * @returns {Object} { scaleFactor, wasClampedToMin }
   */
  function calculateScaleFactor(elementHeight, availableHeight, buffer = 5) {
    const targetHeight = availableHeight - buffer;
    let scaleFactor = targetHeight / elementHeight;
    let wasClampedToMin = false;

    // Enforce minimum scale for readability
    if (scaleFactor < MIN_SCALE_FACTOR) {
      console.warn(
        `Warning: Large graphic requires ${(scaleFactor * 100).toFixed(0)}% scaling. ` +
        `Clamping to minimum ${MIN_SCALE_FACTOR * 100}%. Content may be cut off.`
      );
      scaleFactor = MIN_SCALE_FACTOR;
      wasClampedToMin = true;
    }

    return { scaleFactor, wasClampedToMin };
  }

  /**
   * Task 3: Applies CSS transform scaling to an element
   * @param {HTMLElement} element - The element to scale
   * @param {number} scaleFactor - Scale factor (0.5 = 50%)
   * @param {string} elementType - Type of element (svg, pre, img, table)
   */
  function applyGraphicScaling(element, scaleFactor, elementType) {
    // Get original dimensions before transform
    const originalHeight = element.offsetHeight;

    // Task 4: Handle SVG elements (Mermaid diagrams)
    if (elementType === 'svg') {
      // Remove max-width constraint that may interfere
      element.style.maxWidth = 'none';
    }

    // Apply CSS transform
    element.style.transform = `scale(${scaleFactor})`;
    element.style.transformOrigin = 'top left';

    // Calculate margin adjustment to collapse visual space
    const scaledHeight = originalHeight * scaleFactor;
    const marginAdjustment = originalHeight - scaledHeight;

    // Apply negative margin to pull subsequent content up
    element.style.marginBottom = `-${marginAdjustment}px`;
  }

  /**
   * Task 6: Handles all oversized elements by applying appropriate scaling
   * @param {Array} oversizedElements - Array of oversized element data
   * @param {number} pageHeightPx - Page height in pixels
   */
  function handleOversizedElements(oversizedElements, pageHeightPx) {
    if (!oversizedElements || oversizedElements.length === 0) {
      return;
    }

    let scaledCount = 0;
    let clampedCount = 0;

    for (const item of oversizedElements) {
      // Calculate required scale factor
      const { scaleFactor, wasClampedToMin } = calculateScaleFactor(
        item.height,
        pageHeightPx
      );

      // Apply scaling to the element
      applyGraphicScaling(item.element, scaleFactor, item.type);

      scaledCount++;
      if (wasClampedToMin) {
        clampedCount++;
      }
    }

    console.log('Oversized graphics scaling complete:', {
      totalScaled: scaledCount,
      clampedToMinimum: clampedCount
    });
  }

  // ============================================
  // End Oversized Graphics Scaling Functions
  // ============================================

  exportPdf.addEventListener("click", async function () {
    try {
      const originalText = exportPdf.innerHTML;
      exportPdf.innerHTML = '<i class="bi bi-hourglass-split"></i> Generating...';
      exportPdf.disabled = true;

      const progressContainer = document.createElement('div');
      progressContainer.style.position = 'fixed';
      progressContainer.style.top = '50%';
      progressContainer.style.left = '50%';
      progressContainer.style.transform = 'translate(-50%, -50%)';
      progressContainer.style.padding = '15px 20px';
      progressContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
      progressContainer.style.color = 'white';
      progressContainer.style.borderRadius = '5px';
      progressContainer.style.zIndex = '9999';
      progressContainer.style.textAlign = 'center';

      const statusText = document.createElement('div');
      statusText.textContent = 'Generating PDF...';
      progressContainer.appendChild(statusText);
      document.body.appendChild(progressContainer);

      const markdown = markdownEditor.value;
      const html = marked.parse(markdown);
      const sanitizedHtml = DOMPurify.sanitize(html, {
        ADD_TAGS: ['mjx-container', 'svg', 'path', 'g', 'marker', 'defs', 'pattern', 'clipPath'],
        ADD_ATTR: ['id', 'class', 'style', 'viewBox', 'd', 'fill', 'stroke', 'transform', 'marker-end', 'marker-start']
      });

      const tempElement = document.createElement("div");
      tempElement.className = "markdown-body pdf-export";
      tempElement.innerHTML = sanitizedHtml;
      tempElement.style.padding = "20px";
      tempElement.style.width = "210mm";
      tempElement.style.margin = "0 auto";
      tempElement.style.fontSize = "14px";
      tempElement.style.position = "fixed";
      tempElement.style.left = "-9999px";
      tempElement.style.top = "0";

      const currentTheme = document.documentElement.getAttribute("data-theme");
      tempElement.style.backgroundColor = currentTheme === "dark" ? "#0d1117" : "#ffffff";
      tempElement.style.color = currentTheme === "dark" ? "#c9d1d9" : "#24292e";

      document.body.appendChild(tempElement);

      await new Promise(resolve => setTimeout(resolve, 200));

      try {
        await mermaid.run({
          nodes: tempElement.querySelectorAll('.mermaid'),
          suppressErrors: true
        });
      } catch (mermaidError) {
        console.warn("Mermaid rendering issue:", mermaidError);
      }

      if (window.MathJax) {
        try {
          await MathJax.typesetPromise([tempElement]);
        } catch (mathJaxError) {
          console.warn("MathJax rendering issue:", mathJaxError);
        }

        // Hide MathJax assistive elements that cause duplicate text in PDF
        // These are screen reader elements that html2canvas captures as visible
        // Use multiple CSS properties to ensure html2canvas doesn't render them
        const assistiveElements = tempElement.querySelectorAll('mjx-assistive-mml');
        assistiveElements.forEach(el => {
          el.style.display = 'none';
          el.style.visibility = 'hidden';
          el.style.position = 'absolute';
          el.style.width = '0';
          el.style.height = '0';
          el.style.overflow = 'hidden';
          el.remove(); // Remove entirely from DOM
        });

        // Also hide any MathJax script elements that might contain source
        const mathScripts = tempElement.querySelectorAll('script[type*="math"], script[type*="tex"]');
        mathScripts.forEach(el => el.remove());
      }

      await new Promise(resolve => setTimeout(resolve, 500));

      // Analyze and apply page-breaks for graphics (Story 1.1 + 1.2)
      const pageBreakAnalysis = applyPageBreaksWithCascade(tempElement, PAGE_CONFIG);

      // Scale oversized graphics that can't fit on a single page (Story 1.3)
      if (pageBreakAnalysis.oversizedElements && pageBreakAnalysis.pageHeightPx) {
        handleOversizedElements(pageBreakAnalysis.oversizedElements, pageBreakAnalysis.pageHeightPx);
      }

      const pdfOptions = {
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true,
        hotfixes: ["px_scaling"]
      };

      const pdf = new jspdf.jsPDF(pdfOptions);
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      const contentWidth = pageWidth - (margin * 2);

      const canvas = await html2canvas(tempElement, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        windowWidth: 1000,
        windowHeight: tempElement.scrollHeight
      });

      const scaleFactor = canvas.width / contentWidth;
      const imgHeight = canvas.height / scaleFactor;
      const pagesCount = Math.ceil(imgHeight / (pageHeight - margin * 2));

      for (let page = 0; page < pagesCount; page++) {
        if (page > 0) pdf.addPage();

        const sourceY = page * (pageHeight - margin * 2) * scaleFactor;
        const sourceHeight = Math.min(canvas.height - sourceY, (pageHeight - margin * 2) * scaleFactor);
        const destHeight = sourceHeight / scaleFactor;

        const pageCanvas = document.createElement('canvas');
        pageCanvas.width = canvas.width;
        pageCanvas.height = sourceHeight;

        const ctx = pageCanvas.getContext('2d');
        ctx.drawImage(canvas, 0, sourceY, canvas.width, sourceHeight, 0, 0, canvas.width, sourceHeight);

        const imgData = pageCanvas.toDataURL('image/png');
        pdf.addImage(imgData, 'PNG', margin, margin, contentWidth, destHeight);
      }

      pdf.save("document.pdf");

      statusText.textContent = 'Download successful!';
      setTimeout(() => {
        document.body.removeChild(progressContainer);
      }, 1500);

      document.body.removeChild(tempElement);
      exportPdf.innerHTML = originalText;
      exportPdf.disabled = false;

    } catch (error) {
      console.error("PDF export failed:", error);
      alert("PDF export failed: " + error.message);
      exportPdf.innerHTML = '<i class="bi bi-file-earmark-pdf"></i> Export';
      exportPdf.disabled = false;

      const progressContainer = document.querySelector('div[style*="Preparing PDF"]');
      if (progressContainer) {
        document.body.removeChild(progressContainer);
      }
    }
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

  // ============================================
  // Share via URL (pako compression + base64url)
  // ============================================

  const MAX_SHARE_URL_LENGTH = 32000;

  function encodeMarkdownForShare(text) {
    const compressed = pako.deflate(new TextEncoder().encode(text));
    const chunkSize = 0x8000;
    let binary = '';
    for (let i = 0; i < compressed.length; i += chunkSize) {
      binary += String.fromCharCode.apply(null, compressed.subarray(i, i + chunkSize));
    }
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  function decodeMarkdownFromShare(encoded) {
    let base64 = decodeURIComponent(encoded).replace(/-/g, '+').replace(/_/g, '/');
    // Add missing padding to prevent atob InvalidCharacterError in some browsers
    while (base64.length % 4) {
      base64 += '=';
    }
    const binary = atob(base64);
    const bytes = Uint8Array.from(binary, c => c.charCodeAt(0));
    return new TextDecoder().decode(pako.inflate(bytes));
  }

  function copyShareUrl(btn) {
    const markdownText = markdownEditor.value;
    let encoded;
    try {
      encoded = encodeMarkdownForShare(markdownText);
    } catch (e) {
      console.error("Share encoding failed:", e);
      alert("Failed to encode content for sharing: " + e.message);
      return;
    }

    const shareUrl = window.location.origin + window.location.pathname + '#share=' + encoded;
    const tooLarge = shareUrl.length > MAX_SHARE_URL_LENGTH;

    const originalHTML = btn.innerHTML;
    const copiedHTML = '<i class="bi bi-check-lg"></i> Copied!';

    function onCopied() {
      if (!tooLarge) {
        window.location.hash = 'share=' + encoded;
      }
      btn.innerHTML = copiedHTML;
      setTimeout(() => { btn.innerHTML = originalHTML; }, 2000);
    }

    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(shareUrl).then(onCopied).catch(() => {
        // clipboard.writeText failed; nothing further to do in secure context
      });
    } else {
      try {
        const tempInput = document.createElement("textarea");
        tempInput.value = shareUrl;
        document.body.appendChild(tempInput);
        tempInput.select();
        document.execCommand("copy");
        document.body.removeChild(tempInput);
        onCopied();
      } catch (_) {
        // copy failed silently
      }
    }
  }

  shareButton.addEventListener("click", function () { copyShareUrl(shareButton); });
  mobileShareButton.addEventListener("click", function () { copyShareUrl(mobileShareButton); });

  /**
   * Extract and decode share hash from the URL.
   * Returns the decoded markdown string, or null if no share hash is present.
   * This is a pure decoder — it does NOT touch the editor or tabs.
   */
  function decodeShareHash() {
    if (typeof pako === 'undefined') {
      console.error("pako is undefined. Cannot load shared content.");
      return null;
    }

    let encoded = '';
    const hash = window.location.hash;
    
    if (hash.startsWith('#share=')) {
      encoded = hash.slice('#share='.length);
    } else {
      // Fallback for percent-encoded hashes or mangled URLs by chat apps
      const href = window.location.href;
      const shareMatch = href.match(/(?:#|%23)share=([^&?]*)/);
      if (shareMatch) {
        encoded = shareMatch[1];
      }
    }

    if (!encoded) return null;

    // Remove any trailing tracking parameters or garbage added by social apps
    const validMatch = encoded.match(/^[A-Za-z0-9\-_]+/);
    if (validMatch) {
      encoded = validMatch[0];
    } else {
      return null;
    }

    try {
      return decodeMarkdownFromShare(encoded);
    } catch (e) {
      console.error("Failed to decode shared content:", e);
      alert("The shared URL could not be decoded. It may be corrupted or incomplete.");
      return null;
    }
  }

  /**
   * Handle share hash changes when the app is already open.
   * Creates a new tab with the shared content.
   */
  function loadFromShareHashChange() {
    const shareContent = decodeShareHash();
    if (shareContent === null) return;

    const shareTab = createTab(shareContent, 'Shared Note');
    tabs.push(shareTab);
    activeTabId = shareTab.id;
    markdownEditor.value = shareContent;
    restoreViewMode('split');
    renderMarkdown();
    saveTabsToStorage(tabs);
    saveActiveTabId(activeTabId);
    renderTabBar(tabs, activeTabId);
  }

  // Handle hash changes if the user clicks a share link while the app is already open
  window.addEventListener('hashchange', () => {
    if (window.location.hash.startsWith('#share=')) {
      loadFromShareHashChange();
    }
  });

  const dropEvents = ["dragenter", "dragover", "dragleave", "drop"];

  dropEvents.forEach((eventName) => {
    dropzone.addEventListener(eventName, preventDefaults, false);
    document.body.addEventListener(eventName, preventDefaults, false);
  });

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
    if (e.target !== closeDropzoneBtn && !closeDropzoneBtn.contains(e.target)) {
      fileInput.click();
    }
  });
  closeDropzoneBtn.addEventListener("click", function(e) {
    e.stopPropagation(); 
    dropzone.style.display = "none";
  });

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

  document.addEventListener("keydown", async function (e) {
    if ((e.ctrlKey || e.metaKey) && e.key === "s") {
      e.preventDefault();
      
      const currentTab = tabs.find(t => t.id === activeTabId);
      if (localVaultMode && vaultDirHandle && currentTab) {
        if (currentTab.handle) {
          await saveCurrentTabState();
          const exportBtn = document.getElementById('exportDropdown');
          if (exportBtn) {
             const origHtml = exportBtn.innerHTML;
             exportBtn.innerHTML = '<i class="bi bi-check2"></i> <span class="btn-label">Saved</span>';
             setTimeout(() => { exportBtn.innerHTML = origHtml; }, 1500);
          }
        } else {
          try {
            let name = prompt('Save to Vault as:', currentTab.title + '.md');
            if (name) {
              if (!name.endsWith('.md')) name += '.md';
              let fileHandle;
              try {
                fileHandle = await vaultDirHandle.getFileHandle(name, { create: false });
                if (!confirm('File "' + name + '" already exists. Overwrite?')) return;
                fileHandle = await vaultDirHandle.getFileHandle(name, { create: true });
              } catch(err) {
                fileHandle = await vaultDirHandle.getFileHandle(name, { create: true });
              }
              const writable = await fileHandle.createWritable();
              await writable.write(currentTab.content || markdownEditor.value);
              await writable.close();
              
              currentTab.handle = fileHandle;
              currentTab.title = name.replace(/\\.md$/i, '');
              currentTab.id = '/' + name;
              
              renderTabBar(tabs, activeTabId);
              await renderVaultTree();
              
              const exportBtn = document.getElementById('exportDropdown');
              if (exportBtn) {
                 const origHtml = exportBtn.innerHTML;
                 exportBtn.innerHTML = '<i class="bi bi-check2"></i> <span class="btn-label">Saved</span>';
                 setTimeout(() => { exportBtn.innerHTML = origHtml; }, 1500);
              }
            }
          } catch(err) {
            alert('Error saving to vault: ' + err.message);
          }
        }
      } else {
        exportMd.click();
      }
    }
    if ((e.ctrlKey || e.metaKey) && e.key === "c") {
      const activeEl = document.activeElement;
      const isTextControl = activeEl && (activeEl.tagName === "TEXTAREA" || activeEl.tagName === "INPUT");
      const hasSelection = window.getSelection && window.getSelection().toString().trim().length > 0;
      if (!isTextControl && !hasSelection) {
        e.preventDefault();
        copyMarkdownButton.click();
      }
    }
    // Story 1.2: Only allow sync toggle shortcut when in split view
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "S") {
      e.preventDefault();
      if (currentViewMode === 'split') {
        toggleSyncScrolling();
      }
    }
    // New tab
    if ((e.ctrlKey || e.metaKey) && e.key === "t") {
      e.preventDefault();
      newTab();
    }
    // Close tab
    if ((e.ctrlKey || e.metaKey) && e.key === "w") {
      e.preventDefault();
      closeTab(activeTabId);
    }
    // Close Mermaid zoom modal with Escape
    if (e.key === "Escape") {
      closeMermaidModal();
    }
  });

  document.getElementById('tab-reset-btn').addEventListener('click', function() {
    resetAllTabs();
  });

  // ========================================
  // MERMAID DIAGRAM TOOLBAR
  // ========================================

  /**
   * Serialises an SVG element to a data URL suitable for use as an image source.
   * Inline styles and dimensions are preserved so the PNG matches the rendered diagram.
   */
  function svgToDataUrl(svgEl) {
    const clone = svgEl.cloneNode(true);
    // Ensure explicit width/height so the canvas has the right dimensions
    const bbox = svgEl.getBoundingClientRect();
    if (!clone.getAttribute('width'))  clone.setAttribute('width',  Math.round(bbox.width));
    if (!clone.getAttribute('height')) clone.setAttribute('height', Math.round(bbox.height));
    const serialized = new XMLSerializer().serializeToString(clone);
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(serialized);
  }

  /**
   * Renders an SVG element onto a canvas and resolves with the canvas.
   */
  function svgToCanvas(svgEl) {
    return new Promise((resolve, reject) => {
      const bbox = svgEl.getBoundingClientRect();
      const scale = window.devicePixelRatio || 1;
      const width  = Math.max(Math.round(bbox.width),  1);
      const height = Math.max(Math.round(bbox.height), 1);

      const canvas = document.createElement('canvas');
      canvas.width  = width  * scale;
      canvas.height = height * scale;
      const ctx = canvas.getContext('2d');
      ctx.scale(scale, scale);

      // Fill background matching current theme using the CSS variable value
      const bgColor = getComputedStyle(document.documentElement)
        .getPropertyValue('--bg-color').trim() || '#ffffff';
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, width, height);

      const img = new Image();
      img.onload  = () => { ctx.drawImage(img, 0, 0, width, height); resolve(canvas); };
      img.onerror = reject;
      img.src = svgToDataUrl(svgEl);
    });
  }

  /** Downloads the diagram in the given container as a PNG file. */
  async function downloadMermaidPng(container, btn) {
    const svgEl = container.querySelector('svg');
    if (!svgEl) return;
    const original = btn.innerHTML;
    btn.innerHTML = '<i class="bi bi-hourglass-split"></i>';
    try {
      const canvas = await svgToCanvas(svgEl);
      canvas.toBlob(blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `diagram-${Date.now()}.png`;
        a.click();
        URL.revokeObjectURL(url);
        btn.innerHTML = '<i class="bi bi-check-lg"></i>';
        setTimeout(() => { btn.innerHTML = original; }, 1500);
      }, 'image/png');
    } catch (e) {
      console.error('Mermaid PNG export failed:', e);
      btn.innerHTML = original;
    }
  }

  /** Copies the diagram in the given container as a PNG image to the clipboard. */
  async function copyMermaidImage(container, btn) {
    const svgEl = container.querySelector('svg');
    if (!svgEl) return;
    const original = btn.innerHTML;
    btn.innerHTML = '<i class="bi bi-hourglass-split"></i>';
    try {
      const canvas = await svgToCanvas(svgEl);
      canvas.toBlob(async blob => {
        try {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob })
          ]);
          btn.innerHTML = '<i class="bi bi-check-lg"></i> Copied!';
        } catch (clipErr) {
          console.error('Clipboard write failed:', clipErr);
          btn.innerHTML = '<i class="bi bi-x-lg"></i>';
        }
        setTimeout(() => { btn.innerHTML = original; }, 1800);
      }, 'image/png');
    } catch (e) {
      console.error('Mermaid copy failed:', e);
      btn.innerHTML = original;
    }
  }

  /** Downloads the SVG source of a diagram. */
  function downloadMermaidSvg(container, btn) {
    const svgEl = container.querySelector('svg');
    if (!svgEl) return;
    const clone = svgEl.cloneNode(true);
    const serialized = new XMLSerializer().serializeToString(clone);
    const blob = new Blob([serialized], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `diagram-${Date.now()}.svg`;
    a.click();
    URL.revokeObjectURL(url);
    const original = btn.innerHTML;
    btn.innerHTML = '<i class="bi bi-check-lg"></i>';
    setTimeout(() => { btn.innerHTML = original; }, 1500);
  }

  // ---- Zoom modal state ----
  let modalCurrentSvgEl = null;
  let panzoomInstance = null;

  const mermaidZoomModal   = document.getElementById('mermaid-zoom-modal');
  const mermaidModalDiagram = document.getElementById('mermaid-modal-diagram');

  function closeMermaidModal() {
    if (!mermaidZoomModal.classList.contains('active')) return;
    mermaidZoomModal.classList.remove('active');
    if (panzoomInstance) {
      panzoomInstance.dispose();
      panzoomInstance = null;
    }
    mermaidModalDiagram.innerHTML = '';
    modalCurrentSvgEl = null;
  }

  /** Opens the zoom modal with the SVG from the given container. */
  function openMermaidZoomModal(container) {
    const svgEl = container.querySelector('svg');
    if (!svgEl) return;

    if (panzoomInstance) {
      panzoomInstance.dispose();
      panzoomInstance = null;
    }
    mermaidModalDiagram.innerHTML = '';

    const svgClone = svgEl.cloneNode(true);
    // Remove fixed dimensions so it sizes naturally inside the modal
    svgClone.removeAttribute('width');
    svgClone.removeAttribute('height');
    svgClone.style.width  = 'auto';
    svgClone.style.height = 'auto';
    svgClone.style.maxWidth  = '100%';
    svgClone.style.maxHeight = '100%';
    mermaidModalDiagram.appendChild(svgClone);
    modalCurrentSvgEl = svgClone;

    mermaidZoomModal.classList.add('active');

    // Initialize anvaka/panzoom — works natively with SVG elements
    // Supports smooth wheel zoom, touch pinch-to-zoom, and drag-to-pan out of the box
    setTimeout(() => {
      panzoomInstance = panzoom(svgClone, {
        maxZoom: 10,
        minZoom: 0.1,
        smoothScroll: true,      // Smooth inertial scrolling
        zoomDoubleClickSpeed: 1, // Disable double-click zoom (we have buttons)
        bounds: false,           // No boundary constraints — free roaming
      });
    }, 50);
  }

  // Modal close button
  document.getElementById('mermaid-modal-close').addEventListener('click', closeMermaidModal);
  // Click backdrop to close
  mermaidZoomModal.addEventListener('click', function(e) {
    if (e.target === mermaidZoomModal) closeMermaidModal();
  });

  // Zoom controls
  document.getElementById('mermaid-modal-zoom-in').addEventListener('click', () => {
    if (panzoomInstance) {
      const t = panzoomInstance.getTransform();
      panzoomInstance.smoothZoom(t.x, t.y, 1.5);
    }
  });
  document.getElementById('mermaid-modal-zoom-out').addEventListener('click', () => {
    if (panzoomInstance) {
      const t = panzoomInstance.getTransform();
      panzoomInstance.smoothZoom(t.x, t.y, 0.7);
    }
  });
  document.getElementById('mermaid-modal-zoom-reset').addEventListener('click', () => {
    if (panzoomInstance) {
      panzoomInstance.moveTo(0, 0);
      panzoomInstance.zoomAbs(0, 0, 1);
    }
  });

  // Modal download buttons (operate on the currently displayed SVG)
  document.getElementById('mermaid-modal-download-png').addEventListener('click', async function() {
    if (!modalCurrentSvgEl) return;
    const btn = this;
    const original = btn.innerHTML;
    btn.innerHTML = '<i class="bi bi-hourglass-split"></i>';
    try {
      // Use the original SVG (with dimensions) for proper PNG rendering
      const canvas = await svgToCanvas(modalCurrentSvgEl);
      canvas.toBlob(blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `diagram-${Date.now()}.png`; a.click();
        URL.revokeObjectURL(url);
        btn.innerHTML = '<i class="bi bi-check-lg"></i>';
        setTimeout(() => { btn.innerHTML = original; }, 1500);
      }, 'image/png');
    } catch (e) {
      console.error('Modal PNG export failed:', e);
      btn.innerHTML = original;
    }
  });

  document.getElementById('mermaid-modal-copy').addEventListener('click', async function() {
    if (!modalCurrentSvgEl) return;
    const btn = this;
    const original = btn.innerHTML;
    btn.innerHTML = '<i class="bi bi-hourglass-split"></i>';
    try {
      const canvas = await svgToCanvas(modalCurrentSvgEl);
      canvas.toBlob(async blob => {
        try {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob })
          ]);
          btn.innerHTML = '<i class="bi bi-check-lg"></i> Copied!';
        } catch (clipErr) {
          console.error('Clipboard write failed:', clipErr);
          btn.innerHTML = '<i class="bi bi-x-lg"></i>';
        }
        setTimeout(() => { btn.innerHTML = original; }, 1800);
      }, 'image/png');
    } catch (e) {
      console.error('Modal copy failed:', e);
      btn.innerHTML = original;
    }
  });

  document.getElementById('mermaid-modal-download-svg').addEventListener('click', function() {
    if (!modalCurrentSvgEl) return;
    const serialized = new XMLSerializer().serializeToString(modalCurrentSvgEl);
    const blob = new Blob([serialized], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `diagram-${Date.now()}.svg`; a.click();
    URL.revokeObjectURL(url);
  });

  /**
   * Adds the hover toolbar to every rendered Mermaid container.
   * Safe to call multiple times – existing toolbars are not duplicated.
   */
  function addMermaidToolbars() {
    markdownPreview.querySelectorAll('.mermaid-container').forEach(container => {
      if (container.querySelector('.mermaid-toolbar')) return; // already added
      const svgEl = container.querySelector('svg');
      if (!svgEl) return; // diagram not yet rendered

      const toolbar = document.createElement('div');
      toolbar.className = 'mermaid-toolbar';
      toolbar.setAttribute('aria-label', 'Diagram actions');

      const btnZoom = document.createElement('button');
      btnZoom.className = 'mermaid-toolbar-btn';
      btnZoom.title = 'Zoom diagram';
      btnZoom.setAttribute('aria-label', 'Zoom diagram');
      btnZoom.innerHTML = '<i class="bi bi-arrows-fullscreen"></i>';
      btnZoom.addEventListener('click', () => openMermaidZoomModal(container));

      const btnPng = document.createElement('button');
      btnPng.className = 'mermaid-toolbar-btn';
      btnPng.title = 'Download PNG';
      btnPng.setAttribute('aria-label', 'Download PNG');
      btnPng.innerHTML = '<i class="bi bi-file-image"></i> PNG';
      btnPng.addEventListener('click', () => downloadMermaidPng(container, btnPng));

      const btnCopy = document.createElement('button');
      btnCopy.className = 'mermaid-toolbar-btn';
      btnCopy.title = 'Copy image to clipboard';
      btnCopy.setAttribute('aria-label', 'Copy image to clipboard');
      btnCopy.innerHTML = '<i class="bi bi-clipboard-image"></i> Copy';
      btnCopy.addEventListener('click', () => copyMermaidImage(container, btnCopy));

      const btnSvg = document.createElement('button');
      btnSvg.className = 'mermaid-toolbar-btn';
      btnSvg.title = 'Download SVG';
      btnSvg.setAttribute('aria-label', 'Download SVG');
      btnSvg.innerHTML = '<i class="bi bi-filetype-svg"></i> SVG';
      btnSvg.addEventListener('click', () => downloadMermaidSvg(container, btnSvg));

      toolbar.appendChild(btnZoom);
      toolbar.appendChild(btnCopy);
      toolbar.appendChild(btnPng);
      toolbar.appendChild(btnSvg);
      container.appendChild(toolbar);

      // Double-click on diagram to toggle zoom modal
      container.addEventListener('dblclick', (e) => {
        // Don't trigger if clicking on the toolbar buttons
        if (e.target.closest('.mermaid-toolbar')) return;
        if (mermaidZoomModal.classList.contains('active')) {
          closeMermaidModal();
        } else {
          openMermaidZoomModal(container);
        }
      });
    });
  }

  // ========================================
  // HIDE HEADER MODE
  // ========================================
  const focusModeBtn = document.getElementById("focus-mode-btn");
  const exitFocusBtn = document.getElementById("exit-focus-btn");

  let isFocusMode = false;

  function toggleFocusMode() {
    isFocusMode = !isFocusMode;
    if (isFocusMode) {
      document.body.classList.add('focus-mode');
    } else {
      document.body.classList.remove('focus-mode');
    }
  }

  if (focusModeBtn) focusModeBtn.addEventListener("click", toggleFocusMode);
  if (exitFocusBtn) exitFocusBtn.addEventListener("click", toggleFocusMode);

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && isFocusMode) {
      toggleFocusMode();
    }
  });

  // ========================================
  // 1. PRIVACY NOTICE
  // ========================================
  const privacyNotice = document.getElementById('privacy-notice');
  const privacyDismiss = document.getElementById('privacy-dismiss');

  if (privacyNotice && !localStorage.getItem('kido-privacy-dismissed')) {
    privacyNotice.style.display = 'block';
  }

  if (privacyDismiss) {
    privacyDismiss.addEventListener('click', () => {
      privacyNotice.classList.add('dismissing');
      localStorage.setItem('kido-privacy-dismissed', '1');
      setTimeout(() => { privacyNotice.style.display = 'none'; }, 300);
    });
  }

  // ========================================
  // 2. SEARCH
  // ========================================
  const searchBtn = document.getElementById('search-btn');
  const searchOverlay = document.getElementById('search-overlay');
  const searchInput = document.getElementById('search-input');
  const searchResults = document.getElementById('search-results');

  function openSearch() {
    if (!searchOverlay) return;
    searchOverlay.style.display = 'flex';
    setTimeout(() => searchInput.focus(), 50);
  }

  function closeSearch() {
    if (!searchOverlay) return;
    searchOverlay.style.display = 'none';
    searchInput.value = '';
    searchResults.innerHTML = '<div class="search-empty">Type to search across all your notes</div>';
  }

  async function performSearch(query) {
    if (!query || query.length < 2) {
      searchResults.innerHTML = '<div class="search-empty">Type to search across all your notes</div>';
      return;
    }
    
    let matches = [];
    const lowerQuery = query.toLowerCase();

    if (localVaultMode && vaultMiniSearch) {
      const results = vaultMiniSearch.search(query, { prefix: true, fuzzy: 0.2 });
      matches = results.map(r => {
        return {
          id: r.id,
          title: r.title || r.id.split('/').pop(),
          content: r.content || '',
          pinned: false
        };
      });
    } else {
      const allTabs = await loadTabsFromStorage();
      matches = allTabs.filter(t =>
        (t.title && t.title.toLowerCase().includes(lowerQuery)) ||
        (t.content && t.content.toLowerCase().includes(lowerQuery))
      );
    }

    if (matches.length === 0) {
      searchResults.innerHTML = '<div class="search-empty">No results found</div>';
      return;
    }

    searchResults.innerHTML = matches.map(t => {
      const pinnedIcon = t.pinned ? '<i class="bi bi-star-fill pinned-icon"></i>' : '';
      let snippet = '';
      if (t.content) {
        const idx = t.content.toLowerCase().indexOf(lowerQuery);
        if (idx >= 0) {
          const start = Math.max(0, idx - 40);
          const end = Math.min(t.content.length, idx + query.length + 40);
          const before = t.content.slice(start, idx);
          const match = t.content.slice(idx, idx + query.length);
          const after = t.content.slice(idx + query.length, end);
          snippet = (start > 0 ? '…' : '') + before + '<mark>' + match + '</mark>' + after + (end < t.content.length ? '…' : '');
        } else {
          snippet = t.content.slice(0, 80) + (t.content.length > 80 ? '…' : '');
        }
      }
      return '<div class="search-result-item" data-tab-id="' + t.id + '">' +
        '<div class="search-result-title">' + pinnedIcon + (t.title || 'Untitled') + '</div>' +
        '<div class="search-result-snippet">' + snippet + '</div></div>';
    }).join('');

    searchResults.querySelectorAll('.search-result-item').forEach(item => {
      item.addEventListener('click', async () => {
        const tabId = item.dataset.tabId;
        const query = searchInput ? searchInput.value.trim() : '';
        
        if (localVaultMode) {
           // Find entry
           const entry = vaultEntries ? vaultEntries.find(e => e.path === tabId) : null;
           if (entry) {
             await openVaultFile(entry);
           }
        } else {
           await switchTab(tabId);
        }
        closeSearch();

        // Scroll preview pane to first match after render settles
        if (query) {
          setTimeout(() => {
            const previewPane = document.getElementById('preview-content');
            if (!previewPane) return;
            // Find all text nodes and highlight first match
            const walker = document.createTreeWalker(previewPane, NodeFilter.SHOW_TEXT);
            const lowerQuery = query.toLowerCase();
            let node;
            while ((node = walker.nextNode())) {
              const idx = node.nodeValue.toLowerCase().indexOf(lowerQuery);
              if (idx !== -1) {
                // Wrap match in a temporary highlight span
                const range = document.createRange();
                range.setStart(node, idx);
                range.setEnd(node, idx + query.length);
                const mark = document.createElement('mark');
                mark.className = 'search-scroll-highlight';
                mark.style.cssText = 'background:rgba(168,85,247,0.5);border-radius:2px;color:inherit;';
                range.surroundContents(mark);
                mark.scrollIntoView({ behavior: 'smooth', block: 'center' });
                // Remove highlight after 2s
                setTimeout(() => {
                  const parent = mark.parentNode;
                  if (parent) {
                    parent.replaceChild(document.createTextNode(mark.textContent), mark);
                    parent.normalize();
                  }
                }, 2000);
                break;
              }
            }
          });
        }
      });
    });
  }

  if (searchBtn) searchBtn.addEventListener('click', openSearch);

  if (searchOverlay) {
    searchOverlay.addEventListener('click', (e) => {
      if (e.target === searchOverlay) closeSearch();
    });
  }

  if (searchInput) {
    searchInput.addEventListener('input', () => performSearch(searchInput.value));
  }

  // Ctrl/Cmd + K shortcut
  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      if (searchOverlay && searchOverlay.style.display === 'flex') {
        closeSearch();
      } else {
        openSearch();
      }
    }
    if (e.key === 'Escape' && searchOverlay && searchOverlay.style.display === 'flex') {
      closeSearch();
    }
  });

  // ========================================
  // 3. PIN & FAVORITES
  // ========================================
  function togglePinTab(tabId) {
    const tab = tabs.find(t => t.id === tabId);
    if (!tab) return;
    tab.pinned = !tab.pinned;
    saveTabsToStorage(tabs);
    renderTabList();
  }

  // Sort tabs: pinned first
  const originalRenderTabList = typeof renderTabList === 'function' ? renderTabList : null;
  // We'll handle pinned sorting inside renderTabList by sorting the tabs array before rendering

  // ========================================
  // 4. TAGS
  // ========================================
  const tagFilterBtn = document.getElementById('tag-filter-btn');
  const tagFilterDropdown = document.getElementById('tag-filter-dropdown');
  const tagFilterList = document.getElementById('tag-filter-list');
  const tagFilterClear = document.getElementById('tag-filter-clear');
  let activeTagFilter = null;

  function promptTagTab(tabId) {
    const tab = tabs.find(t => t.id === tabId);
    if (!tab) return;
    const currentTags = (tab.tags || []).join(', ');
    const input = prompt('Enter tags (comma-separated):', currentTags);
    if (input === null) return; // cancelled
    tab.tags = input.split(',').map(t => t.trim()).filter(Boolean);
    saveTabsToStorage(tabs);
    renderTabList();
  }

  function getAllTags() {
    const tagSet = new Set();
    tabs.forEach(t => { (t.tags || []).forEach(tag => tagSet.add(tag)); });
    return Array.from(tagSet).sort();
  }

  function renderTagFilter() {
    if (!tagFilterList) return;
    const allTags = getAllTags();
    if (allTags.length === 0) {
      tagFilterList.innerHTML = '<div style="padding:8px;color:var(--text-muted);font-size:12px;">No tags yet. Use the tab menu to add tags.</div>';
      return;
    }
    tagFilterList.innerHTML = allTags.map(tag =>
      '<div class="tag-filter-item' + (activeTagFilter === tag ? ' active' : '') + '" data-tag="' + tag + '">' +
      '<i class="bi bi-tag"></i> ' + tag + '</div>'
    ).join('');

    tagFilterList.querySelectorAll('.tag-filter-item').forEach(item => {
      item.addEventListener('click', () => {
        activeTagFilter = item.dataset.tag;
        renderTagFilter();
        renderTabList();
        tagFilterDropdown.style.display = 'none';
      });
    });
  }

  if (tagFilterBtn) {
    tagFilterBtn.addEventListener('click', () => {
      const isOpen = tagFilterDropdown.style.display !== 'none';
      tagFilterDropdown.style.display = isOpen ? 'none' : 'block';
      if (!isOpen) renderTagFilter();
    });
  }

  if (tagFilterClear) {
    tagFilterClear.addEventListener('click', () => {
      activeTagFilter = null;
      renderTabList();
      tagFilterDropdown.style.display = 'none';
    });
  }

  // Close tag filter on outside click
  document.addEventListener('click', (e) => {
    if (tagFilterDropdown && !e.target.closest('#tag-filter-wrapper')) {
      tagFilterDropdown.style.display = 'none';
    }
  });

  // ========================================
  // 5. VERSION HISTORY
  // ========================================
  const HISTORY_KEY = 'kido-md-history';
  let appHistory = [];
  const historyBtn = document.getElementById('history-btn');
  const historyPanel = document.getElementById('history-panel');
  const historyOverlay = document.getElementById('history-overlay');
  const historyClose = document.getElementById('history-close');
  const historyListEl = document.getElementById('history-list');
  const historyDiffView = document.getElementById('history-diff-view');
  const historyDiffContent = document.getElementById('history-diff-content');
  const historyDiffTitle = document.getElementById('history-diff-title');
  const historyBack = document.getElementById('history-back');

  async function initHistory() {
    try { 
      const data = await localforage.getItem(HISTORY_KEY);
      appHistory = data ? JSON.parse(data) : [];
    } catch { 
      appHistory = []; 
    }
  }

  function loadHistory() {
    return appHistory;
  }

  function saveHistory(history) {
    appHistory = history;
    localforage.setItem(HISTORY_KEY, JSON.stringify(history)).catch(e => console.warn(e));
  }

  function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  /** Called when user shares — saves a snapshot */
  function saveShareSnapshot(content, title) {
    const history = loadHistory();
    const tabSnapshots = history.filter(s => s.tabId === activeTabId);
    const lastSnapshot = tabSnapshots.length > 0 ? tabSnapshots[tabSnapshots.length - 1] : null;
    const snapshot = {
      id: generateId(),
      tabId: activeTabId,
      title: title || 'Untitled',
      content: content,
      timestamp: Date.now(),
      parentId: lastSnapshot ? lastSnapshot.id : null
    };
    history.push(snapshot);
    // Keep max 200 snapshots total
    if (history.length > 200) history.splice(0, history.length - 200);
    saveHistory(history);
    return snapshot;
  }

  function openHistory() {
    if (!historyPanel) return;
    const allHistory = loadHistory();
    // Only show snapshots for the current tab (filter by tabId; fall back to all for old entries)
    const history = allHistory.filter(s => !s.tabId || s.tabId === activeTabId);
    historyDiffView.style.display = 'none';
    historyListEl.style.display = 'block';

    // Show current tab name in panel header
    const currentTab = tabs.find(t => t.id === activeTabId);
    const panelTitle = historyPanel.querySelector('h3');
    if (panelTitle) {
      panelTitle.innerHTML = '<i class="bi bi-clock-history"></i> ' +
        (currentTab ? currentTab.title : 'Version') + ' History';
    }

    if (history.length === 0) {
      historyListEl.innerHTML = '<div class="history-empty">No history for this note yet.<br>Share it to start tracking versions.</div>';
    } else {
      historyListEl.innerHTML = history.slice().reverse().map(s => {
        const date = new Date(s.timestamp);
        const timeStr = date.toLocaleString();
        const parentInfo = s.parentId ? '<span class="has-parent"><i class="bi bi-git"></i> has parent</span>' : '';
        const chars = s.content ? s.content.length + ' chars' : '';
        return '<div class="history-item" data-id="' + s.id + '">' +
          '<div class="history-item-title">' + (s.title || 'Untitled') + '</div>' +
          '<div class="history-item-meta"><span>' + timeStr + '</span><span>' + chars + '</span>' + parentInfo + '</div></div>';
      }).join('');

      historyListEl.querySelectorAll('.history-item').forEach(item => {
        item.addEventListener('click', () => {
          const snapId = item.dataset.id;
          showHistoryDiff(snapId);
        });
      });
    }

    historyPanel.style.display = 'flex';
    historyOverlay.style.display = 'block';
  }

  function closeHistory() {
    if (historyPanel) historyPanel.style.display = 'none';
    if (historyOverlay) historyOverlay.style.display = 'none';
  }

  function showHistoryDiff(snapId) {
    const history = loadHistory();
    const snap = history.find(s => s.id === snapId);
    if (!snap) return;

    const parent = snap.parentId ? history.find(s => s.id === snap.parentId) : null;

    historyListEl.style.display = 'none';
    historyDiffView.style.display = 'flex';

    if (!parent) {
      historyDiffTitle.textContent = 'First version — ' + (snap.title || 'Untitled');
      historyDiffContent.innerHTML = snap.content.split('\n').map(
        line => '<div class="diff-line diff-added">+ ' + escapeHtml(line) + '</div>'
      ).join('');
      return;
    }

    historyDiffTitle.textContent = 'Changes from previous version';

    if (typeof Diff !== 'undefined' && Diff.diffLines) {
      const diff = Diff.diffLines(parent.content || '', snap.content || '');
      historyDiffContent.innerHTML = diff.map(part => {
        const lines = part.value.split('\n').filter((l, i, arr) => i < arr.length - 1 || l !== '');
        const cls = part.added ? 'diff-added' : part.removed ? 'diff-removed' : 'diff-unchanged';
        const prefix = part.added ? '+ ' : part.removed ? '- ' : '  ';
        return lines.map(line => '<div class="diff-line ' + cls + '">' + prefix + escapeHtml(line) + '</div>').join('');
      }).join('');
    } else {
      historyDiffContent.innerHTML = '<div class="history-empty">Diff library not loaded</div>';
    }
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  if (historyBtn) historyBtn.addEventListener('click', openHistory);
  if (historyClose) historyClose.addEventListener('click', closeHistory);
  if (historyOverlay) historyOverlay.addEventListener('click', closeHistory);
  if (historyBack) {
    historyBack.addEventListener('click', () => {
      historyDiffView.style.display = 'none';
      historyListEl.style.display = 'block';
    });
  }

  // Drag-to-resize history panel
  const historyResizeHandle = document.getElementById('history-resize-handle');
  if (historyResizeHandle && historyPanel) {
    let isResizing = false;
    let startX = 0;
    let startWidth = 0;

    historyResizeHandle.addEventListener('mousedown', (e) => {
      isResizing = true;
      startX = e.clientX;
      startWidth = historyPanel.offsetWidth;
      historyResizeHandle.classList.add('dragging');
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
      if (!isResizing) return;
      const dx = startX - e.clientX; // dragging left = wider
      const newWidth = Math.min(Math.max(startWidth + dx, 280), window.innerWidth * 0.8);
      historyPanel.style.width = newWidth + 'px';
    });

    document.addEventListener('mouseup', () => {
      if (isResizing) {
        isResizing = false;
        historyResizeHandle.classList.remove('dragging');
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      }
    });
  }

  // Hook into share: save snapshot on every share
  const origCopyShareUrl = copyShareUrl;
  copyShareUrl = function(btn) {
    const currentTab = tabs.find(t => t.id === activeTabId);
    const title = currentTab ? currentTab.title : 'Untitled';
    saveShareSnapshot(markdownEditor.value, title);
    origCopyShareUrl(btn);
  };

  // ========================================
  // 6. BACKUP / RESTORE
  // ========================================
  const backupBtn = document.getElementById('backup-btn');
  const restoreBtn = document.getElementById('restore-btn');
  const restoreFileInput = document.getElementById('restore-file-input');

  async function exportBackup() {
    const backup = {
      version: 1,
      exportedAt: new Date().toISOString(),
      data: {}
    };
    // Collect all kido-md related keys
    const keysToBackup = [STORAGE_KEY, ACTIVE_TAB_KEY, UNTITLED_COUNTER_KEY, GROUPS_KEY, HISTORY_KEY, 'kido-privacy-dismissed'];
    for (const key of keysToBackup) {
      const val = await localforage.getItem(key);
      if (val !== null) backup.data[key] = val;
    }

    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'kido-backup-' + new Date().toISOString().slice(0, 10) + '.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  function importBackup(file) {
    const reader = new FileReader();
    reader.onload = async function(e) {
      try {
        const backup = JSON.parse(e.target.result);
        if (!backup.data || typeof backup.data !== 'object') {
          alert('Invalid backup file format.');
          return;
        }
        if (!confirm('This will replace all your current notes. Are you sure?')) return;

        for (const [key, value] of Object.entries(backup.data)) {
          await localforage.setItem(key, value);
        }

        alert('Backup restored successfully! The page will reload.');
        location.reload();
      } catch (err) {
        alert('Failed to read backup file: ' + err.message);
      }
    };
    reader.readAsText(file);
  }

  if (backupBtn) {
    backupBtn.addEventListener('click', (e) => { e.preventDefault(); exportBackup(); });
  }

  if (restoreBtn) {
    restoreBtn.addEventListener('click', (e) => { e.preventDefault(); restoreFileInput.click(); });
  }

  if (restoreFileInput) {
    restoreFileInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) importBackup(e.target.files[0]);
      restoreFileInput.value = ''; // reset
    });
  }

});
