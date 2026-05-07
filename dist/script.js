(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),e.crossOrigin===`use-credentials`?t.credentials=`include`:e.crossOrigin===`anonymous`?t.credentials=`omit`:t.credentials=`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var e=document.getElementById(`markdown-editor`),t=document.getElementById(`theme-toggle`),n=document.getElementById(`toggle-sync`),r=document.getElementById(`markdown-editor`),i=document.querySelector(`.preview-pane`),a=document.getElementById(`reading-time`),o=document.getElementById(`word-count`),s=document.getElementById(`char-count`);function c(){let e=window.matchMedia&&window.matchMedia(`(prefers-color-scheme: dark)`).matches;if(document.documentElement.setAttribute(`data-theme`,e?`dark`:`light`),t){t.textContent=``;let n=document.createElement(`i`);n.className=e?`bi bi-sun`:`bi bi-moon`,t.appendChild(n)}}function l(){let e=document.getElementById(`privacy-notice`),t=document.getElementById(`privacy-dismiss`);e&&!localStorage.getItem(`kido-privacy-dismissed`)&&(e.style.display=`block`),t&&t.addEventListener(`click`,()=>{e.classList.add(`dismissing`),localStorage.setItem(`kido-privacy-dismissed`,`1`),setTimeout(()=>{e.style.display=`none`},300)})}var u=`markdownViewerTabs`,d=`markdownViewerActiveTab`,f=`markdownViewerUntitledCounter`,p=`markdownViewerGroups`,m=`kido-md-history`,h={tabs:[],activeTabId:null,tabGroups:[],localVaultMode:!1,vaultDirHandle:null,vaultEntries:[],expandedVaultPaths:new Set,vaultMiniSearch:null};async function g(e,t,n){try{if(e.handle.kind===`directory`){let n=await e.parentDir.getDirectoryHandle(t,{create:!0});async function r(e,t){for await(let[n,i]of e.entries())if(i.kind===`file`){let e=await i.getFile(),r=await(await t.getFileHandle(n,{create:!0})).createWritable();await r.write(await e.arrayBuffer()),await r.close()}else i.kind===`directory`&&await r(i,await t.getDirectoryHandle(n,{create:!0}))}await r(e.handle,n),await e.parentDir.removeEntry(e.name,{recursive:!0});let i=h.tabGroups.find(t=>t.name===e.name);i&&(i.name=t,q(h.tabs,h.activeTabId),typeof saveTabGroups==`function`&&saveTabGroups())}else{t.endsWith(`.md`)||(t+=`.md`);let n=await(await e.handle.getFile()).text(),r=await e.parentDir.getFileHandle(t,{create:!0}),i=await r.createWritable();await i.write(n),await i.close(),await e.parentDir.removeEntry(e.name),h.activeTabId===e.path&&(h.activeTabId=e.path.substring(0,e.path.lastIndexOf(`/`))+`/`+t);let a=h.tabs.find(t=>t.id===e.path);a&&(a.id=e.path.substring(0,e.path.lastIndexOf(`/`))+`/`+t,a.title=t,a.handle=r)}await b()}catch(e){alert(`Rename failed: `+e.message),n&&n()}}function _(e,t,n){let r=document.createElement(`input`);r.type=`text`,r.value=t,r.className=`inline-rename-input`;let i=!1,a=e=>{i||(i=!0,n(e))};r.onblur=()=>a(r.value.trim()),r.onkeydown=e=>{e.key===`Enter`&&a(r.value.trim()),e.key===`Escape`&&a(t)},e.replaceWith(r),r.focus(),r.select()}async function v(t){if(!t)return;if(h.vaultDirHandle=t,h.localVaultMode=!0,document.querySelector(`.empty-vault-message`).style.display=`none`,await h.vaultDirHandle.queryPermission({mode:`readwrite`})!==`granted`){let e=document.createElement(`button`);e.className=`tool-button`,e.style.margin=`10px`,e.innerText=`Re-authorize Vault Access`,e.onclick=async()=>{await h.vaultDirHandle.requestPermission({mode:`readwrite`})===`granted`&&await b()};let t=document.getElementById(`file-tree`);t.innerHTML=``,t.appendChild(e);return}h.tabs=[],h.activeTabId=null,e.value=``,q(h.tabs,h.activeTabId),document.getElementById(`root-new-folder-btn`).style.display=`inline-flex`,document.getElementById(`root-new-file-btn`).style.display=`inline-flex`,document.querySelector(`.vault-action-divider`)&&(document.querySelector(`.vault-action-divider`).style.display=`block`);let n=async()=>{try{let e=prompt(`New Markdown File Name at Root:`);e&&(e.endsWith(`.md`)||(e+=`.md`),await h.vaultDirHandle.getFileHandle(e,{create:!0}),await b())}catch(e){alert(`Error: `+e.message)}},r=async()=>{try{let e=prompt(`New Folder Name at Root:`);e&&(await h.vaultDirHandle.getDirectoryHandle(e,{create:!0}),await b())}catch(e){alert(`Error: `+e.message)}},i=document.getElementById(`root-new-file-btn`),a=document.getElementById(`root-new-folder-btn`);i.replaceWith(i.cloneNode(!0)),a.replaceWith(a.cloneNode(!0)),document.getElementById(`root-new-file-btn`).addEventListener(`click`,n),document.getElementById(`root-new-folder-btn`).addEventListener(`click`,r),await b()}async function y(e){let t=h.tabs.find(t=>t.id===e.path);if(!t){t=K(``,e.name),t.id=e.path,t.handle=e.handle;let n=e.path.split(`/`).filter(Boolean);if(n.length>1){let e=n[n.length-2],r=h.tabGroups.find(t=>t.name===e);r||=U(e,GROUP_COLORS[Math.floor(Math.random()*GROUP_COLORS.length)].name),t.groupId=r.id}h.tabs.push(t)}await X(t.id)}async function b(){let e=document.getElementById(`file-tree`);e.innerHTML=``,window.MiniSearch&&(h.vaultMiniSearch=new window.MiniSearch({fields:[`title`,`content`],storeFields:[`title`,`content`,`path`]}));let t=async(e,n,r)=>{let i=[];for await(let[t,r]of e.entries())t.startsWith(`.`)||i.push({name:t,handle:r,path:n+`/`+t,parentDir:e});i.sort((e,t)=>e.handle.kind===t.handle.kind?e.name.localeCompare(t.name):e.handle.kind===`directory`?-1:1);for(let e of i){let n=document.createElement(`div`);n.className=`tree-node`+(e.handle.kind===`directory`?` is-dir`:``);let i=`<i class="bi bi-${e.handle.kind===`directory`?`folder`:`file-text`}"></i>`,a=`<span class="tree-node-title" title="${e.name}">${e.name}</span>`,o=`<div class="tree-node-actions">`;e.handle.kind===`directory`&&(o+=`<button class="tree-node-action-btn" title="New File" data-action="new-file"><i class="bi bi-file-earmark-plus"></i></button>`,o+=`<button class="tree-node-action-btn" title="New Folder" data-action="new-folder"><i class="bi bi-folder-plus"></i></button>`),o+=`<button class="tree-node-action-btn" title="Rename" data-action="rename"><i class="bi bi-pencil"></i></button>`,o+=`<button class="tree-node-action-btn" title="Delete" data-action="delete"><i class="bi bi-trash"></i></button>`,o+=`</div>`,n.innerHTML=i+a+o,r.appendChild(n);let s=null;e.handle.kind===`directory`&&(s=document.createElement(`div`),s.className=`tree-children`,s.style.paddingLeft=`16px`,r.appendChild(s),h.expandedVaultPaths.has(e.path)&&(s.classList.add(`expanded`),n.querySelector(`i`).className=`bi bi-folder2-open`),await t(e.handle,e.path,s)),n.onclick=async t=>{let r=t.target.closest(`.tree-node-action-btn`);if(r){t.stopPropagation();let i=r.dataset.action;try{if(i===`new-file`){let t=prompt(`New Markdown File Name:`);t&&(t.endsWith(`.md`)||(t+=`.md`),await e.handle.getFileHandle(t,{create:!0}),h.expandedVaultPaths.add(e.path),await b())}else if(i===`new-folder`){let t=prompt(`New Folder Name:`);t&&(await e.handle.getDirectoryHandle(t,{create:!0}),h.expandedVaultPaths.add(e.path),await b())}else if(i===`delete`){if(confirm(`Are you sure you want to delete "`+e.name+`"?`)){await e.parentDir.removeEntry(e.name,{recursive:!0});let t=h.tabs.find(t=>t.id===e.path);t&&Ue(t.id),await b()}}else if(i===`rename`){let t=n.querySelector(`.tree-node-title`);_(t,e.name,async n=>{n&&n!==e.name?(r.innerHTML,r.innerHTML=`<i class="bi bi-hourglass-split"></i>`,await g(e,n,()=>{t.replaceWith(t.cloneNode(!0))})):await b()})}}catch(e){alert(`Action failed: `+e.message)}return}t.stopPropagation(),e.handle.kind===`directory`?(s.classList.toggle(`expanded`),s.classList.contains(`expanded`)?h.expandedVaultPaths.add(e.path):h.expandedVaultPaths.delete(e.path),n.querySelector(`i`).className=`bi bi-${s.classList.contains(`expanded`)?`folder2-open`:`folder`}`):e.name.endsWith(`.md`)&&(await y(e),document.querySelectorAll(`.tree-node`).forEach(e=>e.classList.remove(`active`)),n.classList.add(`active`))};let c=n.querySelector(`.tree-node-title`);c.ondblclick=t=>{t.stopPropagation(),_(c,e.name,async t=>{t&&t!==e.name?await g(e,t):await b()})},e.handle.kind===`file`&&e.name.endsWith(`.md`)&&e.handle.getFile().then(e=>e.text()).then(t=>{h.vaultMiniSearch&&h.vaultMiniSearch.add({id:e.path,title:e.name,path:e.path,content:t})})}};await t(h.vaultDirHandle,``,e),await ee()}async function ee(){let e=document.getElementById(`sync-vault-btn`);if(e)if(h.localVaultMode&&h.vaultDirHandle)try{let t=await localforage.getItem(`md-preview-tabs`),n=t?JSON.parse(t):[];n&&n.length>0?(e.style.display=`inline-flex`,e.onclick=async()=>{if(confirm(`Import `+n.length+` virtual notes into your Vault?`))try{for(let e of n){let t=(e.title||`Untitled`).replace(/[\\/:*?"<>|]/g,`-`),n=t+`.md`,r;try{r=await h.vaultDirHandle.getFileHandle(n,{create:!1}),n=t+`_`+Date.now()+`.md`,r=await h.vaultDirHandle.getFileHandle(n,{create:!0})}catch{r=await h.vaultDirHandle.getFileHandle(n,{create:!0})}let i=await r.createWritable();await i.write(e.content||``),await i.close()}alert(`Import successful! Virtual notes are now in your vault.`),await localforage.removeItem(`md-preview-tabs`),e.style.display=`none`,await b()}catch(e){alert(`Error importing notes: `+e.message)}}):e.style.display=`none`}catch{e.style.display=`none`}else e.style.display=`none`}var x=document.getElementById(`mobile-toggle-sync`),S=document.querySelector(`.content-container`),te=document.querySelectorAll(`.view-mode-btn:not(.focus-mode-toggle-btn)`),ne=document.querySelectorAll(`.mobile-view-mode-btn`),C=document.querySelector(`.resize-divider`),re=document.querySelector(`.editor-pane`),w=document.querySelector(`.preview-pane`),T=!0,E=!1,D=!1,O=null,ie=10,k=`split`,A=!1,j=!1,M=50,N=20;function ae(){!T||D||(E=!0,clearTimeout(O),O=setTimeout(()=>{let e=r.scrollTop/(r.scrollHeight-r.clientHeight),t=(i.scrollHeight-i.clientHeight)*e;!isNaN(t)&&isFinite(t)&&(i.scrollTop=t),setTimeout(()=>{E=!1},50)},ie))}function oe(){!T||E||(D=!0,clearTimeout(O),O=setTimeout(()=>{let e=i.scrollTop/(i.scrollHeight-i.clientHeight),t=(r.scrollHeight-r.clientHeight)*e;!isNaN(t)&&isFinite(t)&&(r.scrollTop=t),setTimeout(()=>{D=!1},50)},ie))}function se(){T=!T,T?(n.innerHTML=`<i class="bi bi-link-45deg"></i> Sync Off`,n.classList.add(`sync-disabled`),n.classList.remove(`sync-enabled`),n.classList.add(`border-primary`)):(n.innerHTML=`<i class="bi bi-link"></i> Sync On`,n.classList.add(`sync-enabled`),n.classList.remove(`sync-disabled`),n.classList.remove(`border-primary`))}function ce(e){if(!e||![`editor`,`split`,`preview`].includes(e))return;if(e===`split`&&k===`split`){A=!A,S.classList.remove(`view-editor-only`,`view-preview-only`,`view-split`,`view-split-reversed`),S.classList.add(A?`view-split-reversed`:`view-split`),P();return}if(e===k)return;let t=k;k=e,S.classList.remove(`view-editor-only`,`view-preview-only`,`view-split`,`view-split-reversed`),S.classList.add(e===`editor`?`view-editor-only`:e===`preview`?`view-preview-only`:A?`view-split-reversed`:`view-split`),te.forEach(t=>{t.getAttribute(`data-mode`)===e?(t.classList.add(`active`),t.setAttribute(`aria-pressed`,`true`)):(t.classList.remove(`active`),t.setAttribute(`aria-pressed`,`false`))}),ne.forEach(t=>{t.getAttribute(`data-mode`)===e?(t.classList.add(`active`),t.setAttribute(`aria-pressed`,`true`)):(t.classList.remove(`active`),t.setAttribute(`aria-pressed`,`false`))}),le(e),e===`split`?P():t===`split`&&ge(),(e===`split`||e===`preview`)&&R()}function le(e){let t=e===`split`;n&&(n.style.display=t?``:`none`,n.setAttribute(`aria-hidden`,!t)),x&&(x.style.display=t?``:`none`,x.setAttribute(`aria-hidden`,!t))}function ue(){C&&(C.addEventListener(`mousedown`,de),document.addEventListener(`mousemove`,pe),document.addEventListener(`mouseup`,he),C.addEventListener(`touchstart`,fe),document.addEventListener(`touchmove`,me),document.addEventListener(`touchend`,he))}function de(e){k===`split`&&(e.preventDefault(),j=!0,C.classList.add(`dragging`),document.body.classList.add(`resizing`))}function fe(e){k===`split`&&(e.preventDefault(),j=!0,C.classList.add(`dragging`),document.body.classList.add(`resizing`))}function pe(e){if(!j)return;let t=S.getBoundingClientRect(),n=t.width,r=(e.clientX-t.left)/n*100;r=Math.max(N,Math.min(100-N,r)),M=A?100-r:r,P()}function me(e){if(!j||!e.touches[0])return;let t=S.getBoundingClientRect(),n=t.width,r=(e.touches[0].clientX-t.left)/n*100;r=Math.max(N,Math.min(100-N,r)),M=A?100-r:r,P()}function he(){j&&(j=!1,C.classList.remove(`dragging`),document.body.classList.remove(`resizing`))}function P(){if(k!==`split`)return;let e=100-M;re.style.flex=`0 0 calc(${M}% - 4px)`,w.style.flex=`0 0 calc(${e}% - 4px)`}function ge(){re.style.flex=``,w.style.flex=``}function F(){isFocusMode=!isFocusMode,isFocusMode?document.body.classList.add(`focus-mode`):document.body.classList.remove(`focus-mode`)}focusModeBtn&&focusModeBtn.addEventListener(`click`,F),exitFocusBtn&&exitFocusBtn.addEventListener(`click`,F);function _e(){document.querySelectorAll(`.view-mode-btn:not(.focus-mode-toggle-btn)`).forEach(e=>{e.addEventListener(`click`,function(){ce(this.getAttribute(`data-mode`)),J()})}),r&&r.addEventListener(`scroll`,ae),i&&i.addEventListener(`scroll`,oe),n&&n.addEventListener(`click`,se),ue()}function ve(){let e=document.getElementById(`mobile-menu-panel`),t=document.getElementById(`mobile-menu-overlay`),n=document.getElementById(`mobile-menu-toggle`),r=document.getElementById(`mobile-close-menu`),i=document.getElementById(`mobile-toggle-vault`),a=document.getElementById(`mobile-toggle-sync`),o=document.getElementById(`mobile-import-btn`),s=document.getElementById(`mobile-export-md`),c=document.getElementById(`mobile-export-html`),l=document.getElementById(`mobile-export-pdf`),u=document.getElementById(`mobile-copy-markdown`),d=document.getElementById(`mobile-theme-toggle`),f=document.getElementById(`mobile-new-tab-btn`),p=document.getElementById(`mobile-tab-reset-btn`),m=document.querySelectorAll(`.mobile-view-mode-btn`),h=document.getElementById(`theme-toggle`),g=document.getElementById(`file-input`),_=document.getElementById(`export-md`),v=document.getElementById(`export-html`),y=document.getElementById(`export-pdf`),b=document.getElementById(`copy-markdown-button`);function ee(){e&&e.classList.add(`active`),t&&t.classList.add(`active`)}function x(){e&&e.classList.remove(`active`),t&&t.classList.remove(`active`)}n&&n.addEventListener(`click`,ee),r&&r.addEventListener(`click`,x),t&&t.addEventListener(`click`,x),i&&i.addEventListener(`click`,()=>{let e=document.getElementById(`sidebar-explorer`);e&&e.classList.toggle(`mobile-active`),x()}),a&&a.addEventListener(`click`,()=>{se(),T?(a.innerHTML=`<i class="bi bi-link-45deg me-2"></i> Sync Off`,a.classList.add(`sync-disabled`),a.classList.remove(`sync-enabled`),a.classList.add(`border-primary`)):(a.innerHTML=`<i class="bi bi-link me-2"></i> Sync On`,a.classList.add(`sync-enabled`),a.classList.remove(`sync-disabled`),a.classList.remove(`border-primary`))}),o&&g&&o.addEventListener(`click`,()=>g.click()),s&&_&&s.addEventListener(`click`,()=>_.click()),c&&v&&c.addEventListener(`click`,()=>v.click()),l&&y&&l.addEventListener(`click`,()=>y.click()),u&&b&&u.addEventListener(`click`,()=>b.click()),d&&h&&d.addEventListener(`click`,()=>{h.click(),d.innerHTML=h.innerHTML+` Toggle Dark Mode`}),f&&f.addEventListener(`click`,function(){He(),x()}),p&&p.addEventListener(`click`,function(){x(),Ke()}),m&&m.forEach(e=>{e.addEventListener(`click`,function(){ce(this.getAttribute(`data-mode`)),J(),x()})})}function ye(){let e=document.getElementById(`mobile-char-count`),t=document.getElementById(`mobile-word-count`),n=document.getElementById(`mobile-reading-time`);e&&s&&(e.textContent=s.textContent),t&&o&&(t.textContent=o.textContent),n&&a&&(n.textContent=a.textContent)}function be(e){let t=document.createTreeWalker(e,NodeFilter.SHOW_TEXT,null,!1),n=[],r;for(;r=t.nextNode();){let t=r.parentNode,i=!1;for(;t&&t!==e;){if(t.tagName===`PRE`||t.tagName===`CODE`){i=!0;break}t=t.parentNode}!i&&r.nodeValue.includes(`:`)&&n.push(r)}n.forEach(e=>{let t=e.nodeValue,n=/:([\w+-]+):/g,r,i=0,a=``,o=!1;for(;(r=n.exec(t))!==null;){let e=r[1],s=joypixels.shortnameToUnicode(`:${e}:`);s===`:${e}:`?(a+=t.substring(i,n.lastIndex),i=n.lastIndex):(o=!0,a+=t.substring(i,r.index)+s,i=n.lastIndex)}if(o){a+=t.substring(i);let n=document.createElement(`span`);n.innerHTML=a,e.parentNode.replaceChild(n,e)}})}function xe(e){let t=e.cloneNode(!0),n=e.getBoundingClientRect();t.getAttribute(`width`)||t.setAttribute(`width`,Math.round(n.width)),t.getAttribute(`height`)||t.setAttribute(`height`,Math.round(n.height));let r=new XMLSerializer().serializeToString(t);return`data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(r)))}`}function I(e){return new Promise((t,n)=>{let r=document.createElement(`canvas`),i=r.getContext(`2d`),a=e.getBoundingClientRect(),o=window.devicePixelRatio||2,s=Math.round(a.width),c=Math.round(a.height);r.width=s*o,r.height=c*o,i.scale(o,o),i.fillStyle=getComputedStyle(document.documentElement).getPropertyValue(`--bg-color`).trim()||`#ffffff`,i.fillRect(0,0,s,c);let l=new Image;l.onload=()=>{i.drawImage(l,0,0,s,c),t(r)},l.onerror=n,l.src=xe(e)})}async function Se(e,t){let n=e.querySelector(`svg`);if(!n)return;let r=t.innerHTML;t.innerHTML=`<i class="bi bi-hourglass-split"></i>`;try{(await I(n)).toBlob(e=>{let n=URL.createObjectURL(e),i=document.createElement(`a`);i.href=n,i.download=`diagram-${Date.now()}.png`,i.click(),URL.revokeObjectURL(n),t.innerHTML=`<i class="bi bi-check-lg"></i>`,setTimeout(()=>{t.innerHTML=r},1500)},`image/png`)}catch(e){console.error(`Mermaid PNG export failed:`,e),t.innerHTML=r}}async function Ce(e,t){let n=e.querySelector(`svg`);if(!n)return;let r=t.innerHTML;t.innerHTML=`<i class="bi bi-hourglass-split"></i>`;try{(await I(n)).toBlob(async e=>{try{await navigator.clipboard.write([new ClipboardItem({"image/png":e})]),t.innerHTML=`<i class="bi bi-check-lg"></i> Copied!`}catch(e){console.error(`Clipboard write failed:`,e),t.innerHTML=`<i class="bi bi-x-lg"></i>`}setTimeout(()=>{t.innerHTML=r},1800)},`image/png`)}catch(e){console.error(`Mermaid copy failed:`,e),t.innerHTML=r}}function we(e,t){let n=e.querySelector(`svg`);if(!n)return;let r=n.cloneNode(!0),i=new XMLSerializer().serializeToString(r),a=new Blob([i],{type:`image/svg+xml`}),o=URL.createObjectURL(a),s=document.createElement(`a`);s.href=o,s.download=`diagram-${Date.now()}.svg`,s.click(),URL.revokeObjectURL(o);let c=t.innerHTML;t.innerHTML=`<i class="bi bi-check-lg"></i>`,setTimeout(()=>{t.innerHTML=c},1500)}var L=null;function Te(){let e=document.getElementById(`mermaid-zoom-modal`),t=document.getElementById(`mermaid-modal-diagram`);e.classList.contains(`active`)&&(e.classList.remove(`active`),L&&=(L.dispose(),null),t.innerHTML=``)}function Ee(e){let t=e.querySelector(`svg`);if(!t)return;let n=document.getElementById(`mermaid-zoom-modal`),r=document.getElementById(`mermaid-modal-diagram`);L&&=(L.dispose(),null),r.innerHTML=``;let i=t.cloneNode(!0);i.removeAttribute(`width`),i.removeAttribute(`height`),i.style.width=`auto`,i.style.height=`auto`,i.style.maxWidth=`100%`,i.style.maxHeight=`100%`,r.appendChild(i),n.classList.add(`active`),setTimeout(()=>{L=window.panzoom(i,{maxZoom:10,minZoom:.1,smoothScroll:!0,zoomDoubleClickSpeed:1,bounds:!1})},50)}function De(){let e=document.getElementById(`mermaid-zoom-modal`);document.getElementById(`markdown-preview`).querySelectorAll(`.mermaid-container`).forEach(t=>{if(t.querySelector(`.mermaid-toolbar`)||!t.querySelector(`svg`))return;let n=document.createElement(`div`);n.className=`mermaid-toolbar`,n.setAttribute(`aria-label`,`Diagram actions`);let r=document.createElement(`button`);r.className=`mermaid-toolbar-btn`,r.title=`Zoom diagram`,r.setAttribute(`aria-label`,`Zoom diagram`),r.innerHTML=`<i class="bi bi-arrows-fullscreen"></i>`,r.addEventListener(`click`,()=>Ee(t));let i=document.createElement(`button`);i.className=`mermaid-toolbar-btn`,i.title=`Download PNG`,i.setAttribute(`aria-label`,`Download PNG`),i.innerHTML=`<i class="bi bi-file-image"></i> PNG`,i.addEventListener(`click`,()=>Se(t,i));let a=document.createElement(`button`);a.className=`mermaid-toolbar-btn`,a.title=`Copy image to clipboard`,a.setAttribute(`aria-label`,`Copy image to clipboard`),a.innerHTML=`<i class="bi bi-clipboard-image"></i> Copy`,a.addEventListener(`click`,()=>Ce(t,a));let o=document.createElement(`button`);o.className=`mermaid-toolbar-btn`,o.title=`Download SVG`,o.setAttribute(`aria-label`,`Download SVG`),o.innerHTML=`<i class="bi bi-filetype-svg"></i> SVG`,o.addEventListener(`click`,()=>we(t,o)),n.appendChild(r),n.appendChild(a),n.appendChild(i),n.appendChild(o),t.appendChild(n),t.addEventListener(`dblclick`,n=>{n.target.closest(`.mermaid-toolbar`)||(e.classList.contains(`active`)?Te():Ee(t))})})}function R(){try{let t=e.value,n=marked.parse(t),r=DOMPurify.sanitize(n,{ADD_TAGS:[`mjx-container`],ADD_ATTR:[`id`,`class`,`style`]});markdownPreview.innerHTML=r,be(markdownPreview),initMermaid();try{let e=markdownPreview.querySelectorAll(`.mermaid`);e.length>0&&(e.forEach(e=>{e.innerHTML.includes(`\\n`)&&(e.innerHTML=e.innerHTML.replace(/\\n/g,`<br/>`))}),Promise.resolve(mermaid.init(void 0,e)).then(()=>De()).catch(e=>{console.warn(`Mermaid rendering failed:`,e),De()}))}catch(e){console.warn(`Mermaid rendering failed:`,e)}if(window.MathJax)try{MathJax.typesetPromise([markdownPreview]).catch(e=>{console.warn(`MathJax typesetting failed:`,e)})}catch(e){console.warn(`MathJax rendering failed:`,e)}ke(),ye()}catch(t){console.error(`Markdown rendering failed:`,t),markdownPreview.innerHTML=`<div class="alert alert-danger">
              <strong>Error rendering markdown:</strong> ${t.message}
          </div>
          <pre>${e.value}</pre>`}}function Oe(){clearTimeout(markdownRenderTimeout),markdownRenderTimeout=setTimeout(R,RENDER_DELAY)}function ke(){let t=e.value;s.textContent=t.length.toLocaleString();let n=t.trim()===``?0:t.trim().split(/\s+/).length;o.textContent=n.toLocaleString(),a.textContent=Math.ceil(n/200)}async function Ae(){try{let e=await localforage.getItem(u);return e?JSON.parse(e):[]}catch{return[]}}function z(e){if(!h.localVaultMode)try{localforage.setItem(u,JSON.stringify(e))}catch(e){console.warn(`Failed to save AppState.tabs to localforage:`,e)}}async function je(){return await localforage.getItem(d)}function B(e){h.localVaultMode||localforage.setItem(d,e)}async function Me(){let e=await localforage.getItem(f);return parseInt(e||`0`,10)}function Ne(e){localforage.setItem(f,String(e))}function Pe(){return untitledCounter+=1,Ne(untitledCounter),`Untitled `+untitledCounter}var V=[{name:`gray`,bg:`rgba(156,163,175,0.25)`,border:`#9ca3af`,dot:`#9ca3af`},{name:`blue`,bg:`rgba(59,130,246,0.2)`,border:`#3b82f6`,dot:`#3b82f6`},{name:`purple`,bg:`rgba(168,85,247,0.2)`,border:`#a855f7`,dot:`#a855f7`},{name:`green`,bg:`rgba(34,197,94,0.2)`,border:`#22c55e`,dot:`#22c55e`},{name:`yellow`,bg:`rgba(234,179,8,0.25)`,border:`#eab308`,dot:`#eab308`},{name:`orange`,bg:`rgba(249,115,22,0.2)`,border:`#f97316`,dot:`#f97316`},{name:`red`,bg:`rgba(239,68,68,0.2)`,border:`#ef4444`,dot:`#ef4444`},{name:`pink`,bg:`rgba(236,72,153,0.2)`,border:`#ec4899`,dot:`#ec4899`}];async function Fe(){try{let e=await localforage.getItem(p);return e?JSON.parse(e):[]}catch{return[]}}function H(){localforage.setItem(p,JSON.stringify(h.tabGroups))}function U(e,t){let n=V.find(e=>e.name===t)||V[2],r={id:`grp_`+Date.now()+`_`+Math.random().toString(36).slice(2,6),name:e||`New Group`,color:n.name,collapsed:!1};return h.tabGroups.push(r),H(),r}function Ie(e){h.tabs.forEach(t=>{t.groupId===e&&(t.groupId=null)}),h.tabGroups=h.tabGroups.filter(t=>t.id!==e),H(),z(h.tabs),q(h.tabs,h.activeTabId)}function Le(e){let t=h.tabGroups.find(t=>t.id===e);if(!t)return;let n=prompt(`Rename group:`,t.name);n!==null&&(t.name=n.trim()||`Unnamed`,H(),q(h.tabs,h.activeTabId))}function Re(e){let t=h.tabGroups.find(t=>t.id===e);t&&(t.collapsed=!t.collapsed,H(),q(h.tabs,h.activeTabId))}function ze(e,t){let n=h.tabGroups.find(t=>t.id===e);n&&(n.color=t,H(),q(h.tabs,h.activeTabId))}function W(e,t){let n=h.tabs.find(t=>t.id===e);n&&(n.groupId=t,z(h.tabs),q(h.tabs,h.activeTabId))}function Be(e){let t=h.tabs.find(t=>t.id===e);t&&(t.groupId=null,z(h.tabs),q(h.tabs,h.activeTabId))}function G(e){return V.find(t=>t.name===e)||V[0]}h.tabGroups=Fe();function K(e,t,n){return e===void 0&&(e=``),t===void 0&&(t=null),n===void 0&&(n=`split`),{id:`tab_`+Date.now()+`_`+Math.random().toString(36).substring(2,8),title:t||`Untitled`,content:e,scrollPos:0,viewMode:n,createdAt:Date.now()}}function q(e,t){let n=document.getElementById(`tab-list`);if(!n)return;n.replaceChildren();function r(e){let t=`<div class="tab-group-submenu">`;return t+=`<button class="tab-menu-item" data-action="new-group"><i class="bi bi-folder-plus"></i> New Group</button>`,h.tabGroups.length>0&&(t+=`<div class="tab-ctx-divider"></div>`,h.tabGroups.forEach(n=>{let r=G(n.color),i=e===n.id?` ✓`:``;t+=`<button class="tab-menu-item" data-action="add-to-group" data-group-id="`+n.id+`"><span class="group-color-dot" style="background:`+r.dot+`"></span> `+(n.name||`Unnamed`)+i+`</button>`})),e&&(t+=`<div class="tab-ctx-divider"></div>`,t+=`<button class="tab-menu-item" data-action="remove-from-group"><i class="bi bi-folder-minus"></i> Remove from Group</button>`),t+=`</div>`,t}function i(e,n){let i=document.createElement(`div`);i.className=`tab-item`+(e.id===t?` active`:``),n&&(i.style.borderBottomColor=n.border,i.classList.add(`in-group`)),i.setAttribute(`data-tab-id`,e.id),i.setAttribute(`role`,`tab`),i.setAttribute(`aria-selected`,e.id===t?`true`:`false`),i.setAttribute(`draggable`,`true`);let a=document.createElement(`span`);a.className=`tab-title`,a.textContent=e.title||`Untitled`,a.ondblclick=n=>{n.stopPropagation(),startInlineRename(a,e.title||`Untitled`,async n=>{n&&n!==e.title?(h.localVaultMode&&e.handle&&(e.id.split(`/`).pop(),e.handle,e.id,h.vaultDirHandle),e.title=n,z(h.tabs),q(h.tabs,t)):q(h.tabs,t)})},a.title=e.title||`Untitled`;let o=document.createElement(`button`);o.className=`tab-menu-btn`,o.setAttribute(`aria-label`,`File options`),o.title=`File options`,o.textContent=`⋯`;let s=document.createElement(`div`);s.className=`tab-menu-dropdown`,s.replaceChildren(),s.insertAdjacentHTML(`beforeend`,`<button class="tab-menu-item" data-action="pin"><i class="bi bi-pin"></i> <span class="pin-label">`+(e.pinned?`Unpin`:`Pin`)+`</span></button><button class="tab-menu-item" data-action="tag"><i class="bi bi-tag"></i> Tag</button><button class="tab-menu-item tab-menu-item-has-sub" data-action="group-menu"><i class="bi bi-collection"></i> Group <i class="bi bi-chevron-right" style="font-size:10px;margin-left:auto"></i></button><div class="tab-ctx-divider"></div><button class="tab-menu-item" data-action="rename"><i class="bi bi-pencil"></i> Rename</button><button class="tab-menu-item" data-action="duplicate"><i class="bi bi-files"></i> Duplicate</button><button class="tab-menu-item tab-menu-item-danger" data-action="delete"><i class="bi bi-trash"></i> Delete</button>`);let c=document.createElement(`div`);c.className=`tab-group-sub-container`,c.style.display=`none`,c.replaceChildren(),c.insertAdjacentHTML(`beforeend`,r(e.groupId)),s.appendChild(c),o.appendChild(s);let l=s.querySelector(`[data-action="group-menu"]`);return l&&(l.addEventListener(`mouseenter`,()=>{c.style.display=`block`;let e=l.getBoundingClientRect();c.style.top=e.top+`px`,c.style.left=e.left-8+`px`}),l.addEventListener(`click`,e=>{e.stopPropagation(),c.style.display=c.style.display===`none`?`block`:`none`})),s.addEventListener(`mouseleave`,()=>{c.style.display=`none`}),c.querySelectorAll(`.tab-menu-item`).forEach(t=>{t.addEventListener(`click`,n=>{n.stopPropagation(),o.classList.remove(`open`);let r=t.dataset.action;if(r===`new-group`){let t=prompt(`Group name:`);if(t===null)return;let n=U(t,`purple`);W(e.id,n.id)}else r===`add-to-group`?W(e.id,t.dataset.groupId):r===`remove-from-group`&&Be(e.id)})}),o.addEventListener(`click`,function(e){if(e.stopPropagation(),document.querySelectorAll(`.tab-menu-btn.open`).forEach(function(e){e!==o&&e.classList.remove(`open`)}),o.classList.toggle(`open`),o.classList.contains(`open`)){var t=o.getBoundingClientRect();s.style.top=t.bottom+4+`px`,s.style.right=window.innerWidth-t.right+`px`,s.style.left=`auto`}}),s.querySelectorAll(`:scope > .tab-menu-item`).forEach(function(t){t.addEventListener(`click`,function(n){n.stopPropagation();let r=t.dataset.action;r!==`group-menu`&&(o.classList.remove(`open`),r===`rename`?We(e.id):r===`duplicate`?Ge(e.id):r===`delete`?Z(e.id):r===`pin`?qe(e.id):r===`tag`&&promptTagTab(e.id))})}),i.appendChild(a),i.appendChild(o),i.addEventListener(`click`,function(){X(e.id)}),i.addEventListener(`dragstart`,function(){draggedTabId=e.id,setTimeout(function(){i.classList.add(`dragging`)},0)}),i.addEventListener(`dragend`,function(){i.classList.remove(`dragging`),draggedTabId=null}),i.addEventListener(`dragover`,function(e){e.preventDefault(),i.classList.add(`drag-over`)}),i.addEventListener(`dragleave`,function(){i.classList.remove(`drag-over`)}),i.addEventListener(`drop`,function(t){if(t.preventDefault(),i.classList.remove(`drag-over`),!draggedTabId||draggedTabId===e.id)return;let n=h.tabs.findIndex(e=>e.id===draggedTabId),r=h.tabs.findIndex(t=>t.id===e.id);if(n===-1||r===-1)return;let a=h.tabs.splice(n,1)[0];e.groupId&&(a.groupId=e.groupId),h.tabs.splice(r,0,a),z(h.tabs),q(h.tabs,h.activeTabId)}),i}function a(e){let t=G(e.color),n=document.createElement(`div`);return n.className=`tab-group-header`+(e.collapsed?` collapsed`:``),n.style.setProperty(`--group-color`,t.border),n.style.setProperty(`--group-bg`,t.bg),n.setAttribute(`data-group-id`,e.id),n.replaceChildren(),n.insertAdjacentHTML(`beforeend`,`<span class="group-color-dot" style="background:`+t.dot+`"></span><span class="group-header-name">`+(e.name||`Unnamed`)+`</span><span class="group-collapse-icon"><i class="bi bi-chevron-`+(e.collapsed?`right`:`down`)+`"></i></span>`),n.addEventListener(`click`,t=>{t.stopPropagation(),Re(e.id)}),n.addEventListener(`dblclick`,t=>{t.stopPropagation(),Le(e.id)}),n.addEventListener(`contextmenu`,t=>{t.preventDefault(),t.stopPropagation(),document.querySelectorAll(`.group-context-menu`).forEach(e=>e.remove());let n=document.createElement(`div`);n.className=`group-context-menu`,n.replaceChildren(),n.insertAdjacentHTML(`beforeend`,`<button data-action="rename"><i class="bi bi-pencil"></i> Rename</button><div class="tab-ctx-divider"></div><div class="group-color-picker">`+V.map(t=>`<span class="group-color-option`+(t.name===e.color?` active`:``)+`" data-color="`+t.name+`" style="background:`+t.dot+`"></span>`).join(``)+`</div><div class="tab-ctx-divider"></div><button class="tab-menu-item-danger" data-action="ungroup"><i class="bi bi-folder-minus"></i> Ungroup All</button><button class="tab-menu-item-danger" data-action="delete-group"><i class="bi bi-trash"></i> Delete Group</button>`),n.style.position=`fixed`,n.style.top=t.clientY+`px`,n.style.left=t.clientX+`px`,document.body.appendChild(n),n.querySelectorAll(`button`).forEach(t=>{t.addEventListener(`click`,r=>{r.stopPropagation(),n.remove();let i=t.dataset.action;i===`rename`?Le(e.id):i===`ungroup`?Ie(e.id):i===`delete-group`&&(h.tabs.filter(t=>t.groupId===e.id).forEach(e=>Z(e.id)),h.tabGroups=h.tabGroups.filter(t=>t.id!==e.id),H(),q(h.tabs,h.activeTabId))})}),n.querySelectorAll(`.group-color-option`).forEach(t=>{t.addEventListener(`click`,r=>{r.stopPropagation(),n.remove(),ze(e.id,t.dataset.color)})});let r=()=>{n.remove(),document.removeEventListener(`click`,r)};setTimeout(()=>document.addEventListener(`click`,r),0)}),n.addEventListener(`dragover`,e=>{e.preventDefault(),n.classList.add(`drag-over`)}),n.addEventListener(`dragleave`,()=>{n.classList.remove(`drag-over`)}),n.addEventListener(`drop`,t=>{t.preventDefault(),n.classList.remove(`drag-over`),draggedTabId&&W(draggedTabId,e.id)}),n}h.tabGroups.forEach(t=>{let r=e.filter(e=>e.groupId===t.id);if(r.length===0)return;let o=G(t.color);n.appendChild(a(t)),t.collapsed||r.forEach(e=>{n.appendChild(i(e,o))})}),e.filter(e=>!e.groupId||!h.tabGroups.some(t=>t.id===e.groupId)).forEach(e=>{n.appendChild(i(e,null))});let o=document.createElement(`button`);o.className=`tab-new-btn`,o.title=`New Tab (Ctrl+T)`,o.setAttribute(`aria-label`,`Open new tab`),o.replaceChildren();let s=document.createElement(`i`);s.className=`bi bi-plus-lg`,o.appendChild(s),o.addEventListener(`click`,function(){He()}),n.appendChild(o);let c=n.querySelector(`.tab-item.active`);c&&c.scrollIntoView({block:`nearest`,inline:`nearest`}),Ve(e,t)}function Ve(e,t){let n=document.getElementById(`mobile-tab-list`);n&&(n.replaceChildren(),e.forEach(function(e){let r=document.createElement(`div`);r.className=`mobile-tab-item`+(e.id===t?` active`:``),r.setAttribute(`role`,`tab`),r.setAttribute(`aria-selected`,e.id===t?`true`:`false`),r.setAttribute(`data-tab-id`,e.id);let i=document.createElement(`span`);i.className=`mobile-tab-title`,i.textContent=e.title||`Untitled`,i.title=e.title||`Untitled`;let a=document.createElement(`button`);a.className=`tab-menu-btn`,a.setAttribute(`aria-label`,`File options`),a.title=`File options`,a.textContent=`⋯`;let o=document.createElement(`div`);o.className=`tab-menu-dropdown`,o.replaceChildren(),o.insertAdjacentHTML(`beforeend`,`<button class="tab-menu-item" data-action="rename"><i class="bi bi-pencil"></i> Rename</button><button class="tab-menu-item" data-action="duplicate"><i class="bi bi-files"></i> Duplicate</button><button class="tab-menu-item tab-menu-item-danger" data-action="delete"><i class="bi bi-trash"></i> Delete</button>`),a.appendChild(o),a.addEventListener(`click`,function(e){if(e.stopPropagation(),document.querySelectorAll(`.tab-menu-btn.open`).forEach(function(e){e!==a&&e.classList.remove(`open`)}),a.classList.toggle(`open`),a.classList.contains(`open`)){let e=a.getBoundingClientRect();o.style.top=e.bottom+4+`px`,o.style.right=window.innerWidth-e.right+`px`,o.style.left=`auto`}}),o.querySelectorAll(`.tab-menu-item`).forEach(function(t){t.addEventListener(`click`,function(n){n.stopPropagation(),a.classList.remove(`open`);let r=t.getAttribute(`data-action`);r===`rename`?(closeMobileMenu(),We(e.id)):r===`duplicate`?(Ge(e.id),closeMobileMenu()):r===`delete`&&Z(e.id)})}),r.appendChild(i),r.appendChild(a),r.addEventListener(`click`,function(){X(e.id),closeMobileMenu()}),n.appendChild(r)}))}document.addEventListener(`click`,function(){document.querySelectorAll(`.tab-menu-btn.open`).forEach(function(e){e.classList.remove(`open`)})});async function J(t=!1){let n=h.tabs.find(function(e){return e.id===h.activeTabId});if(n)if(n.content=e.value,n.scrollPos=e.scrollTop,n.viewMode=currentViewMode||`split`,n.handle&&t===!0)try{let e=await n.handle.createWritable();await e.write(n.content),await e.close(),h.vaultMiniSearch&&h.vaultMiniSearch.add({id:n.id,title:n.title,path:n.path,content:n.content})}catch(e){console.error(`Failed to write cleanly to vault:`,e)}else n.handle||z(h.tabs)}function Y(e){currentViewMode=null,setViewMode(e||`split`)}async function X(t){if(t===h.activeTabId&&!h.localVaultMode)return;await J(!0),h.activeTabId=t,B(h.activeTabId);let n=h.tabs.find(function(e){return e.id===t});if(n){if(n.handle&&!n.content)try{n.content=await(await n.handle.getFile()).text()}catch{n.content=`Error reading file`}e.value=n.content||``,Y(n.viewMode),R(),requestAnimationFrame(function(){e.scrollTop=n.scrollPos||0}),q(h.tabs,h.activeTabId)}}function He(t,n){t===void 0&&(t=``),n||=Pe();let r=K(t,n);r.createdAt=Date.now(),h.tabs.push(r),X(r.id),e.focus()}function Ue(t){let n=h.tabs.findIndex(function(e){return e.id===t});if(n!==-1){if(h.tabs.splice(n,1),h.tabs.length===0){let t=K(``,Pe());h.tabs.push(t),h.activeTabId=t.id,B(h.activeTabId),e.value=``,Y(`split`),R()}else if(h.activeTabId===t){let t=Math.max(0,n-1);h.activeTabId=h.tabs[t].id,B(h.activeTabId);let r=h.tabs[t];e.value=r.content,Y(r.viewMode),R(),requestAnimationFrame(function(){e.scrollTop=r.scrollPos||0})}z(h.tabs),q(h.tabs,h.activeTabId)}}function Z(e){Ue(e)}function We(e){let t=h.tabs.find(function(t){return t.id===e});if(!t)return;let n=document.getElementById(`rename-modal`),r=document.getElementById(`rename-modal-input`),i=document.getElementById(`rename-modal-confirm`),a=document.getElementById(`rename-modal-cancel`);if(!n||!r)return;r.value=t.title,n.style.display=`flex`,r.focus(),r.select();function o(){let e=r.value.trim();e&&(t.title=e,z(h.tabs),q(h.tabs,h.activeTabId)),n.style.display=`none`,s()}function s(){i.removeEventListener(`click`,o),a.removeEventListener(`click`,c),r.removeEventListener(`keydown`,l)}function c(){n.style.display=`none`,s()}function l(e){e.key===`Enter`?o():e.key===`Escape`&&c()}i.addEventListener(`click`,o),a.addEventListener(`click`,c),r.addEventListener(`keydown`,l)}function Ge(e){let t=h.tabs.find(function(t){return t.id===e});if(!t)return;J(!0);let n=t.title+` (copy)`,r=K(t.content,n,t.viewMode);t.groupId&&(r.groupId=t.groupId);let i=h.tabs.findIndex(function(t){return t.id===e});h.tabs.splice(i+1,0,r),X(r.id)}function Ke(){let t=document.getElementById(`reset-confirm-modal`),n=document.getElementById(`reset-modal-confirm`),r=document.getElementById(`reset-modal-cancel`),i=document.getElementById(`reset-modal-title`);if(!t)return;h.localVaultMode?(i.textContent=`Close all AppState.tabs? (Local files will NOT be deleted)`,n.textContent=`Close All`):(i.textContent=`Are you sure you want to delete all virtual files and reset to default?`,n.textContent=`Delete & Reset`),t.style.display=`flex`;function a(){if(t.style.display=`none`,s(),h.tabs=[],h.tabGroups=[],H(),untitledCounter=0,Ne(0),h.localVaultMode)h.activeTabId=null,e.value=``;else{let t=K(sampleMarkdown,`Welcome to Markdown`);if(h.tabs.push(t),typeof demo30ChartsMarkdown<`u`){let e=U(`demo`,`purple`),t=K(demo30ChartsMarkdown,`30 chart`);t.groupId=e.id,h.tabs.push(t)}h.activeTabId=t.id,e.value=sampleMarkdown}B(h.activeTabId),z(h.tabs),Y(`split`),R(),q(h.tabs,h.activeTabId),window.history&&window.history.replaceState?window.history.replaceState(null,null,window.location.pathname):window.location.hash=``}function o(){t.style.display=`none`,s()}function s(){n.removeEventListener(`click`,a),r.removeEventListener(`click`,o)}n.addEventListener(`click`,a),r.addEventListener(`click`,o)}function qe(e){let t=h.tabs.find(t=>t.id===e);t&&(t.pinned=!t.pinned,z(h.tabs),q(h.tabs,h.activeTabId))}var Q=[];document.getElementById(`history-btn`),document.getElementById(`history-panel`),document.getElementById(`history-overlay`),document.getElementById(`history-close`),document.getElementById(`history-list`),document.getElementById(`history-diff-view`),document.getElementById(`history-diff-content`),document.getElementById(`history-diff-title`),document.getElementById(`history-back`);async function Je(){try{let e=await localforage.getItem(m);Q=e?JSON.parse(e):[]}catch{Q=[]}}function Ye(){return Q}function Xe(e){Q=e,localforage.setItem(m,JSON.stringify(e)).catch(e=>console.warn(e))}function Ze(){return Date.now().toString(36)+Math.random().toString(36).slice(2,7)}function $(e,t){let n=Ye(),r=n.filter(e=>e.tabId===h.activeTabId),i=r.length>0?r[r.length-1]:null,a={id:Ze(),tabId:h.activeTabId,title:t||`Untitled`,content:e,timestamp:Date.now(),parentId:i?i.id:null};return n.push(a),n.length>200&&n.splice(0,n.length-200),Xe(n),a}function Qe(){let t=null,n=null;e.addEventListener(`input`,function(){Oe(),clearTimeout(n),n=setTimeout(J,500),clearTimeout(t),t=setTimeout(()=>{let t=e.value;if(!t.trim())return;let n=Ye().filter(e=>e.tabId===h.activeTabId),r=n.length>0?n[n.length-1]:null;if(!r||Math.abs(t.length-(r.content||``).length)>=20){let e=h.tabs.find(e=>e.id===h.activeTabId);$(t,e?e.title:`Untitled`)}},5e3)}),e.addEventListener(`keydown`,function(e){if(e.key===`Tab`){e.preventDefault();let t=this.selectionStart,n=this.selectionEnd,r=this.value;this.value=r.substring(0,t)+`  `+r.substring(n),this.selectionStart=this.selectionEnd=t+2,this.dispatchEvent(new Event(`input`))}})}var $e=`# Project Master Overview: App Master

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
`,et=`# Welcome to Markdown Viewer

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

This is a fully client-side application. Your content never leaves your browser and stays secure on your device.`,tt=32e3;function nt(e){let t=pako.deflate(new TextEncoder().encode(e)),n=32768,r=``;for(let e=0;e<t.length;e+=n)r+=String.fromCharCode.apply(null,t.subarray(e,e+n));return btoa(r).replace(/\+/g,`-`).replace(/\//g,`_`).replace(/=+$/,``)}function rt(e){let t=decodeURIComponent(e).replace(/-/g,`+`).replace(/_/g,`/`);for(;t.length%4;)t+=`=`;let n=atob(t),r=Uint8Array.from(n,e=>e.charCodeAt(0));return new TextDecoder().decode(pako.inflate(r))}function it(t){let n=h.tabs.find(e=>e.id===h.activeTabId),r=n?n.title:`Untitled`;$(e.value,r);let i=e.value,a;try{a=nt(i)}catch(e){console.error(`Share encoding failed:`,e),alert(`Failed to encode content for sharing: `+e.message);return}let o=window.location.origin+window.location.pathname+`#share=`+a,s=o.length>tt,c=t.innerHTML;function l(){s||(window.location.hash=`share=`+a),t.innerHTML=`<i class="bi bi-check-lg"></i> Copied!`,setTimeout(()=>{t.innerHTML=c},2e3)}if(navigator.clipboard&&window.isSecureContext)navigator.clipboard.writeText(o).then(l).catch(()=>{});else try{let e=document.createElement(`textarea`);e.value=o,document.body.appendChild(e),e.select(),document.execCommand(`copy`),document.body.removeChild(e),l()}catch{}}shareButton.addEventListener(`click`,function(){it(shareButton)}),mobileShareButton.addEventListener(`click`,function(){it(mobileShareButton)});function at(){if(typeof pako>`u`)return console.error(`pako is undefined. Cannot load shared content.`),null;let e=``,t=window.location.hash;if(t.startsWith(`#share=`))e=t.slice(7);else{let t=window.location.href.match(/(?:#|%23)share=([^&?]*)/);t&&(e=t[1])}if(!e)return null;let n=e.match(/^[A-Za-z0-9\-_]+/);if(n)e=n[0];else return null;try{return rt(e)}catch(e){return console.error(`Failed to decode shared content:`,e),alert(`The shared URL could not be decoded. It may be corrupted or incomplete.`),null}}function ot(){let t=at();if(t===null)return;let n=K(t,`Shared Note`);h.tabs.push(n),h.activeTabId=n.id,e.value=t,Y(`split`),R(),z(h.tabs),B(h.activeTabId),q(h.tabs,h.activeTabId)}window.addEventListener(`hashchange`,()=>{window.location.hash.startsWith(`#share=`)&&ot()});var st=`markdownViewerTabs`,ct=`markdownViewerActiveTab`,lt=`markdownViewerUntitledCounter`,ut=`kido-vault-handle`,dt=`markdownViewerGroups`;async function ft(){let e=[st,ct,lt,dt,`kido-md-history`,`kido-privacy-dismissed`];for(let t of e){let e=localStorage.getItem(t);e!==null&&(await localforage.setItem(t,e),localStorage.removeItem(t))}}async function pt(){await ft(),await Je(),h.tabGroups=await Fe();let t=await localforage.getItem(ut);if(t&&await v(t),h.untitledCounter=await Me(),h.tabs=await Ae(),h.activeTabId=await je(),!h.localVaultMode){if(h.tabs.length===0){let e=K(et,`Welcome to Markdown`);if(h.tabs.push(e),$e!==void 0){let e=K($e,`30 chart`);h.tabs.push(e)}h.activeTabId=e.id,z(h.tabs),B(h.activeTabId)}else h.tabs.find(e=>e.id===h.activeTabId)||(h.activeTabId=h.tabs[0].id,B(h.activeTabId));let t=at();if(t!==null){let n=K(t,`Shared Note`);h.tabs.push(n),h.activeTabId=n.id,e.value=t,restoreViewMode(`split`),z(h.tabs),B(h.activeTabId)}else{let t=h.tabs.find(e=>e.id===h.activeTabId);t&&(e.value=t.content||``,restoreViewMode(t.viewMode))}}R(),requestAnimationFrame(()=>{if(!h.localVaultMode){let t=h.tabs.find(e=>e.id===h.activeTabId);t&&(e.scrollTop=t.scrollPos||0)}}),q(h.tabs,h.activeTabId),ve()}function mt(){let e=()=>{let e=document.documentElement.getAttribute(`data-theme`)===`dark`?`dark`:`default`;mermaid.initialize({startOnLoad:!1,theme:e,securityLevel:`loose`,flowchart:{useMaxWidth:!0,htmlLabels:!0},fontSize:16})};try{e()}catch(e){console.warn(`Mermaid initialization failed:`,e)}let t={gfm:!0,breaks:!1,pedantic:!1,sanitize:!1,smartypants:!1,xhtml:!1,headerIds:!0,mangle:!1},n=new marked.Renderer;n.code=function(e,t){if(t===`mermaid`){let t=`mermaid-diagram-`+Math.random().toString(36).substr(2,9),n=e;return/^\s*(flowchart|graph)\b/i.test(e)&&(n=e.replace(/(\b\d+\.)\s+/g,`$1&nbsp;`).replace(/(^|[\[\(|]\s*)([-*+])\s+/g,`$1$2&nbsp;`)),`<div class="mermaid-container"><pre class="mermaid" id="${t}">${(e=>e.replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`).replace(/"/g,`&quot;`).replace(/'/g,`&#039;`))(n)}</pre></div>`}let n=hljs.getLanguage(t)?t:`plaintext`;return`<pre><code class="hljs ${n}">${hljs.highlight(e,{language:n}).value}</code></pre>`},n.link=function(e,t,n){let r=marked.Renderer.prototype.link.call(this,e,t,n);return e&&!e.startsWith(`#`)?r.replace(`<a `,`<a target="_blank" rel="noopener noreferrer" `):r},marked.setOptions({...t,renderer:n});let r=marked.parse;marked.parse=function(e,t){try{let n=e.split(`
`),i=[],a=!1,o=!1,s=/^(flowchart|sequenceDiagram|classDiagram|stateDiagram|stateDiagram-v2|erDiagram|journey|gantt|pie|gitGraph|mindmap|timeline|graph|architecture-beta|architecture|sankey-beta|xychart-beta|block-beta|packet-beta|ishikawa|quadrantChart|requirementDiagram|C4Context|C4Container|C4Component|C4Dynamic|C4Deployment)\b/i,c=e=>{let t=e.trim();return!!(!t||/^[ \t]/.test(e)||/^(subgraph|end|click|style|class|classDef|linkStyle|direction|note|participant|actor|activate|deactivate|group|service|title|x-axis|y-axis|quadrant-\d|requirement|functionalRequirement|performanceRequirement|interfaceRequirement|designConstraint|element|contains|copies|derives|satisfies|verifies|refines|traces|columns|space|Person|Person_Ext|System|System_Ext|SystemDb|SystemQueue|Container|Container_Ext|ContainerDb|ContainerQueue|ContainerExt|Component|Component_Ext|ComponentDb|ComponentQueue|Rel|Rel_U|Rel_D|Rel_L|Rel_R|Rel_Back|BiRel|Boundary|Enterprise_Boundary|System_Boundary|Container_Boundary|UpdateElementStyle|UpdateRelStyle|UpdateLayoutConfig)\b/i.test(t)||/[-\=]+\>/.test(t)||t.includes(`---`)||t.includes(`===`)||/\[.*\]|\(.*\)|{.*}|>.*\]/.test(t)||t.includes(`:`)||/^"[^"]+"\s*:\s*\[/.test(t)||/^[A-Za-z0-9_]+$/.test(t)||t.split(`,`).length>=3&&!isNaN(parseFloat(t.split(`,`).pop())))};for(let e=0;e<n.length;e++){let t=n[e];if(t.trim().startsWith("```")){o=!o,i.push(t);continue}if(!o&&!a&&s.test(t.trim())){a=!0,i.push("```mermaid"),i.push(t);continue}if(a){if(/^(#{1,6}\s|\-\-\-|> \s|\*\s|\-\s|\d+\.\s)/.test(t)){i.push("```"),a=!1,i.push(t);continue}if(e>0&&n[e-1].trim()===``&&t.trim()!==``&&!c(t)){i.push("```"),a=!1,i.push(t);continue}}i.push(t)}return a&&i.push("```"),r(i.join(`
`),t)}catch(n){return console.warn(`Markdown parsing error, fallback to original parser:`,n),r(e,t)}}}function ht(){if(!window.driver)return;let e=document.getElementById(`privacy-notice`),t=document.getElementById(`privacy-dismiss`);e&&e.style.display!==`none`&&(t?t.click():e.style.display=`none`),window.driver.js.driver({showProgress:!0,animate:!0,allowClose:!0,nextBtnText:`Tiếp tục ➔`,prevBtnText:`⬅ Quay lại`,doneBtnText:`Hoàn thành ✔`,steps:[{popover:{title:`Chào mừng đến với 2ndBrain! 🚀`,description:`Chào mừng bạn đến với Markdown Editor cao cấp. Hãy dành 1 phút để lướt qua các tính năng đỉnh cao nhé!`,align:`center`}},{element:`#open-vault-btn`,popover:{title:`Kết nối Thư mục (Vault) 📂`,description:`Tính năng cực mạnh! Cấp quyền cho trình duyệt đọc/ghi trực tiếp vào một thư mục trên máy tính của bạn. Giống hệt cách Obsidian hoạt động!`,side:`right`,align:`start`}},{element:`.sidebar-explorer`,popover:{title:`Quản lý File Local 🗂️`,description:`Toàn bộ cây thư mục và tài liệu của bạn sẽ hiển thị ở đây. An toàn tuyệt đối, không có bất kỳ dữ liệu nào gửi lên Server lạ.`,side:`right`,align:`start`}},{element:`.tab-bar`,popover:{title:`Tab & Group Tabs 📑`,description:`Mở nhiều file cùng lúc, gom nhóm (Group) màu sắc các Tab lại với nhau siêu gọn gàng y hệt trình duyệt Chrome!`,side:`bottom`,align:`start`}},{element:`#tag-filter-btn`,popover:{title:`Lọc bài viết theo Tag 🏷️`,description:`Chỉ cần gõ #tag vào bài viết, hệ thống sẽ tự động gom nhóm và giúp bạn lọc file cực nhanh ở đây.`,side:`bottom`,align:`end`}},{element:`#tab-reset-btn`,popover:{title:`Reset Toàn bộ 🗑️`,description:`Nếu muốn dọn dẹp sạch sẽ toàn bộ Cache hiện tại để làm lại từ đầu, hãy bấm nút này.`,side:`bottom`,align:`end`}},{element:`.editor-pane`,popover:{title:`Soạn thảo Siêu tốc ⚡`,description:`Gõ Markdown ở đây. Bạn có thể kéo thả ảnh vào hoặc Paste ảnh trực tiếp. Đừng quên dùng phím tắt Ctrl+S để lưu nhé!`,side:`right`,align:`start`}},{element:`.preview-pane`,popover:{title:`Render Thời gian thực 👁️`,description:`Kết quả hiển thị ngay lập tức. Hỗ trợ Toán học (MathJax), Code Highlight (Highlight.js) và tới 30 loại sơ đồ siêu đỉnh (Mermaid.js)!`,side:`left`,align:`start`}},{element:`.view-mode-group`,popover:{title:`Chế độ Hiển thị 🪟`,description:`Chỉ Code, Chia đôi, hoặc Chỉ xem. Bấm nút Hide (mũi tên lên) ẩn thanh công cụ để tập trung tối đa.`,side:`bottom`,align:`center`}},{element:`#toggle-sync`,popover:{title:`Đồng bộ Cuộn trang ↕️`,description:`Tính năng cuộn đồng thời Editor và Preview cực mượt, giúp bạn không bao giờ bị lạc dòng.`,side:`bottom`,align:`start`}},{element:`#import-button`,popover:{title:`Import File 📤`,description:`Nạp nhanh một file Markdown (.md) từ máy tính của bạn vào Editor.`,side:`bottom`,align:`start`}},{element:`#exportDropdown`,popover:{title:`Xuất / Nhập Đa dạng 📥`,description:`Hỗ trợ xuất sang HTML, PDF, Markdown hoặc Backup tải toàn bộ File (JSON) về máy.`,side:`bottom`,align:`start`}},{element:`#copy-markdown-button`,popover:{title:`Copy Markdown 📋`,description:`Copy nhanh toàn bộ nội dung Markdown hiện tại vào Clipboard chỉ với một Click.`,side:`bottom`,align:`start`}},{element:`#share-button`,popover:{title:`Chia sẻ không cần Database 🔗`,description:`Toàn bộ bài viết sẽ được nén lại thành Link. Bạn bè có thể xem ngay lập tức qua mạng mà không cần Database hay Đăng nhập!`,side:`bottom`,align:`end`}},{element:`#search-btn`,popover:{title:`Tìm kiếm Toàn năng 🔍`,description:`Bấm phím tắt Ctrl+K để tìm kiếm nội dung siêu tốc xuyên suốt toàn bộ các file trong Vault của bạn.`,side:`bottom`,align:`end`}},{element:`#history-btn`,popover:{title:`Lịch sử Phiên bản ⏱️`,description:`Lỡ tay xoá nhầm? Đừng lo! Hệ thống tự động lưu lại các mốc thời gian để bạn dễ dàng phục hồi lại bản nháp cũ.`,side:`bottom`,align:`end`}},{element:`#tour-btn`,popover:{title:`Trợ giúp ❓`,description:`Bạn có thể xem lại hướng dẫn này bất cứ lúc nào bằng nút này. Chúc bạn làm việc hiệu quả!`,side:`left`,align:`center`}}]}).drive()}function gt(){let e=document.getElementById(`tour-btn`);e&&e.addEventListener(`click`,ht),!localStorage.getItem(`hasSeenTour`)&&window.innerWidth>=768&&setTimeout(()=>{ht(),localStorage.setItem(`hasSeenTour`,`true`)},1e3)}function _t(){setInterval(async()=>{if(!h.localVaultMode||!h.vaultDirHandle)return;let e=h.tabs.find(e=>e.id===h.activeTabId);if(e){if(e.handle)e.lastVaultSave||=Date.now(),Date.now()-e.lastVaultSave>=9e4&&(await J(!0),e.lastVaultSave=Date.now(),console.log(`Vault file auto-saved`));else if(e.createdAt||=Date.now(),Date.now()-e.createdAt>=3e5)try{let t=e.title.replace(/[\\/:*?"<>|]/g,`-`);t.endsWith(`.md`)||(t+=`.md`);let n;try{n=await h.vaultDirHandle.getFileHandle(t,{create:!1}),t=t.replace(`.md`,`_`+Date.now()+`.md`),n=await h.vaultDirHandle.getFileHandle(t,{create:!0})}catch{n=await h.vaultDirHandle.getFileHandle(t,{create:!0})}e.handle=n,e.id=h.vaultDirHandle.name+`/`+t,e.lastVaultSave=Date.now(),await J(!0),typeof b==`function`&&b(),console.log(`Virtual file auto-saved to vault after 5 minutes`)}catch(e){console.error(`Auto-save failed`,e)}}},3e4)}e.value=et,document.addEventListener(`DOMContentLoaded`,()=>{mt(),c(),l(),Qe(),_e(),pt(),_t(),gt()});