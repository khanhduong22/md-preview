/**
 * Mermaid Diagram Tools
 * Features: Export PNG/SVG, Copy PNG to clipboard, and Pan/Zoom modal.
 */

export function svgToDataUrl(svgEl) {
  const clone = svgEl.cloneNode(true);
  const bbox = svgEl.getBoundingClientRect();
  if (!clone.getAttribute('width'))  clone.setAttribute('width',  Math.round(bbox.width));
  if (!clone.getAttribute('height')) clone.setAttribute('height', Math.round(bbox.height));
  
  const serialized = new XMLSerializer().serializeToString(clone);
  const b64 = btoa(unescape(encodeURIComponent(serialized)));
  return `data:image/svg+xml;base64,${b64}`;
}

export function svgToCanvas(svgEl) {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    const bbox = svgEl.getBoundingClientRect();
    const scale = window.devicePixelRatio || 2;
    const width = Math.round(bbox.width);
    const height = Math.round(bbox.height);
    
    canvas.width = width * scale;
    canvas.height = height * scale;
    ctx.scale(scale, scale);
    
    const bgColor = getComputedStyle(document.documentElement).getPropertyValue('--bg-color').trim() || '#ffffff';
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width, height);
    
    const img = new Image();
    img.onload  = () => { ctx.drawImage(img, 0, 0, width, height); resolve(canvas); };
    img.onerror = reject;
    img.src = svgToDataUrl(svgEl);
  });
}

export async function downloadMermaidPng(container, btn) {
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

export async function copyMermaidImage(container, btn) {
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

export function downloadMermaidSvg(container, btn) {
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

let modalCurrentSvgEl = null;
let panzoomInstance = null;

export function closeMermaidModal() {
  const mermaidZoomModal = document.getElementById('mermaid-zoom-modal');
  const mermaidModalDiagram = document.getElementById('mermaid-modal-diagram');
  if (!mermaidZoomModal.classList.contains('active')) return;
  mermaidZoomModal.classList.remove('active');
  if (panzoomInstance) {
    panzoomInstance.dispose();
    panzoomInstance = null;
  }
  mermaidModalDiagram.innerHTML = '';
  modalCurrentSvgEl = null;
}

export function openMermaidZoomModal(container) {
  const svgEl = container.querySelector('svg');
  if (!svgEl) return;
  
  const mermaidZoomModal = document.getElementById('mermaid-zoom-modal');
  const mermaidModalDiagram = document.getElementById('mermaid-modal-diagram');

  if (panzoomInstance) {
    panzoomInstance.dispose();
    panzoomInstance = null;
  }
  mermaidModalDiagram.innerHTML = '';

  const svgClone = svgEl.cloneNode(true);
  svgClone.removeAttribute('width');
  svgClone.removeAttribute('height');
  svgClone.style.width  = 'auto';
  svgClone.style.height = 'auto';
  svgClone.style.maxWidth  = '100%';
  svgClone.style.maxHeight = '100%';
  mermaidModalDiagram.appendChild(svgClone);
  modalCurrentSvgEl = svgClone;

  mermaidZoomModal.classList.add('active');

  setTimeout(() => {
    panzoomInstance = window.panzoom(svgClone, {
      maxZoom: 10,
      minZoom: 0.1,
      smoothScroll: true,
      zoomDoubleClickSpeed: 1,
      bounds: false,
    });
  }, 50);
}

export function initMermaidZoomModal() {
  const mermaidZoomModal = document.getElementById('mermaid-zoom-modal');
  document.getElementById('mermaid-modal-close').addEventListener('click', closeMermaidModal);
  
  mermaidZoomModal.addEventListener('click', function(e) {
    if (e.target === mermaidZoomModal) closeMermaidModal();
  });

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

  document.getElementById('mermaid-modal-download-png').addEventListener('click', async function() {
    if (!modalCurrentSvgEl) return;
    const btn = this;
    const original = btn.innerHTML;
    btn.innerHTML = '<i class="bi bi-hourglass-split"></i>';
    try {
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
          await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
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
}

export function addMermaidToolbars() {
  const mermaidZoomModal = document.getElementById('mermaid-zoom-modal');
  const markdownPreview = document.getElementById('markdown-preview');
  markdownPreview.querySelectorAll('.mermaid-container').forEach(container => {
    if (container.querySelector('.mermaid-toolbar')) return; 
    const svgEl = container.querySelector('svg');
    if (!svgEl) return; 

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

    container.addEventListener('dblclick', (e) => {
      if (e.target.closest('.mermaid-toolbar')) return;
      if (mermaidZoomModal.classList.contains('active')) {
        closeMermaidModal();
      } else {
        openMermaidZoomModal(container);
      }
    });
  });
}
