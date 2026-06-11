function withTimeout(promise, ms, errorMessage) {
  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(errorMessage)), ms);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timeoutId));
}

export const PAGE_CONFIG = {
  a4Width: 210,           // mm
  a4Height: 297,          // mm
  margin: 15,             // mm each side
  contentWidth: 180,      // 210 - 30 (margins)
  contentHeight: 267,     // 297 - 30 (margins)
  windowWidth: 1000,      // html2canvas config
  scale: 2                // html2canvas scale factor
};

function identifyGraphicElements(container) {
  const graphics = [];
  container.querySelectorAll('img').forEach(el => graphics.push({ element: el, type: 'img' }));
  container.querySelectorAll('svg').forEach(el => graphics.push({ element: el, type: 'svg' }));
  container.querySelectorAll('pre').forEach(el => graphics.push({ element: el, type: 'pre' }));
  container.querySelectorAll('table').forEach(el => graphics.push({ element: el, type: 'table' }));
  return graphics;
}

function calculateElementPositions(elements, container) {
  const containerRect = container.getBoundingClientRect();
  return elements.map(item => {
    const rect = item.element.getBoundingClientRect();
    const top = rect.top - containerRect.top;
    const height = rect.height;
    return {
      element: item.element,
      type: item.type,
      top: top,
      height: height,
      bottom: top + height
    };
  });
}

function calculatePageBoundaries(totalHeight, elementWidth, pageConfig) {
  const width = elementWidth || 793; // 210mm A4 width fallback at 96dpi
  const aspectRatio = pageConfig.contentHeight / pageConfig.contentWidth;
  const pageHeightPx = width * aspectRatio;
  const boundaries = [];
  
  if (pageHeightPx < 10) {
    return { boundaries, pageHeightPx: 0 };
  }

  let y = pageHeightPx;
  while (y < totalHeight) {
    boundaries.push(y);
    y += pageHeightPx;
  }
  return { boundaries, pageHeightPx };
}

function detectSplitElements(elements, pageBoundaries) {
  if (!elements || elements.length === 0) return [];
  if (!pageBoundaries || pageBoundaries.length === 0) return [];

  const splitElements = [];
  for (const item of elements) {
    let startPage = 0;
    for (let i = 0; i < pageBoundaries.length; i++) {
      if (item.top >= pageBoundaries[i]) startPage = i + 1;
      else break;
    }
    let endPage = 0;
    for (let i = 0; i < pageBoundaries.length; i++) {
      if (item.bottom > pageBoundaries[i]) endPage = i + 1;
      else break;
    }

    if (endPage > startPage) {
      const boundaryY = pageBoundaries[startPage] || pageBoundaries[0];
      splitElements.push({
        element: item.element,
        type: item.type,
        top: item.top,
        height: item.height,
        splitPageIndex: startPage,
        overflowAmount: item.bottom - boundaryY
      });
    }
  }
  return splitElements;
}

function analyzeGraphicsForPageBreaks(tempElement) {
  try {
    const graphics = identifyGraphicElements(tempElement);
    const elementsWithPositions = calculateElementPositions(graphics, tempElement);
    const { boundaries: pageBoundaries, pageHeightPx } = calculatePageBoundaries(
      tempElement.scrollHeight,
      tempElement.offsetWidth,
      PAGE_CONFIG
    );
    const splitElements = detectSplitElements(elementsWithPositions, pageBoundaries);
    return {
      totalElements: graphics.length,
      splitElements: splitElements,
      pageCount: pageBoundaries.length + 1,
      pageBoundaries: pageBoundaries,
      pageHeightPx: pageHeightPx
    };
  } catch (error) {
    console.error('Page-break analysis failed:', error);
    return {
      totalElements: 0, splitElements: [], pageCount: 1, pageBoundaries: [], pageHeightPx: 0
    };
  }
}

const PAGE_BREAK_THRESHOLD = 0.3;

function categorizeBySize(splitElements, pageHeightPx) {
  const fittingElements = [];
  const oversizedElements = [];
  for (const item of splitElements) {
    if (item.height <= pageHeightPx) fittingElements.push(item);
    else oversizedElements.push(item);
  }
  return { fittingElements, oversizedElements };
}

function insertPageBreaks(fittingElements, pageHeightPx) {
  for (const item of fittingElements) {
    const currentPageBottom = (item.splitPageIndex + 1) * pageHeightPx;
    const remainingSpace = currentPageBottom - item.top;
    const remainingRatio = remainingSpace / pageHeightPx;

    if (remainingRatio > PAGE_BREAK_THRESHOLD) {
      if (item.height * 0.9 <= remainingSpace) continue;
    }

    const marginNeeded = currentPageBottom - item.top + 5;
    let targetElement = item.element;
    if (item.type === 'svg' && item.element.parentElement) {
      targetElement = item.element.parentElement;
    }

    const currentMargin = parseFloat(targetElement.style.marginTop) || 0;
    targetElement.style.marginTop = `${currentMargin + marginNeeded}px`;
  }
}

export function applyPageBreaksWithCascade(tempElement, pageConfig, maxIterations = 10) {
  let iteration = 0;
  let analysis;
  let previousSplitCount = -1;

  do {
    analysis = analyzeGraphicsForPageBreaks(tempElement);
    if (!analysis.pageHeightPx || analysis.splitElements.length === 0) break;
    if (analysis.splitElements.length === previousSplitCount) break;
    previousSplitCount = analysis.splitElements.length;

    const { fittingElements, oversizedElements } = categorizeBySize(analysis.splitElements, analysis.pageHeightPx);
    analysis.oversizedElements = oversizedElements;
    if (fittingElements.length === 0) break;

    insertPageBreaks(fittingElements, analysis.pageHeightPx);
    iteration++;
  } while (iteration < maxIterations);

  return analysis;
}

const MIN_SCALE_FACTOR = 0.5;

function calculateScaleFactor(elementHeight, availableHeight, buffer = 5) {
  const targetHeight = availableHeight - buffer;
  let scaleFactor = targetHeight / elementHeight;
  let wasClampedToMin = false;

  if (scaleFactor < MIN_SCALE_FACTOR) {
    scaleFactor = MIN_SCALE_FACTOR;
    wasClampedToMin = true;
  }
  return { scaleFactor, wasClampedToMin };
}

function applyGraphicScaling(element, scaleFactor, elementType) {
  const originalHeight = element.offsetHeight;
  if (elementType === 'svg') {
    element.style.maxWidth = 'none';
  }
  element.style.transform = `scale(${scaleFactor})`;
  element.style.transformOrigin = 'top left';
  const scaledHeight = originalHeight * scaleFactor;
  element.style.marginBottom = `-${originalHeight - scaledHeight}px`;
}

export function handleOversizedElements(oversizedElements, pageHeightPx) {
  if (!oversizedElements || oversizedElements.length === 0) return;
  for (const item of oversizedElements) {
    const { scaleFactor } = calculateScaleFactor(item.height, pageHeightPx);
    applyGraphicScaling(item.element, scaleFactor, item.type);
  }
}

export async function exportToPdf(markdown, exportPdfBtn, currentTheme) {
  try {
    const originalText = exportPdfBtn.innerHTML;
    exportPdfBtn.innerHTML = '<i class="bi bi-hourglass-split"></i> Generating...';
    exportPdfBtn.disabled = true;

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

    const html = window.marked ? window.marked.parse(markdown) : marked.parse(markdown);
    const sanitizedHtml = DOMPurify.sanitize(html, {
      ADD_TAGS: ['mjx-container', 'svg', 'path', 'g', 'marker', 'defs', 'pattern', 'clipPath'],
      ADD_ATTR: ['id', 'class', 'style', 'viewBox', 'd', 'fill', 'stroke', 'transform', 'marker-end', 'marker-start']
    });

    const tempElement = document.createElement("div");
    tempElement.className = "markdown-body pdf-export";
    tempElement.innerHTML = sanitizedHtml;
    tempElement.style.padding = "20px";
    tempElement.style.width = "210mm";
    tempElement.style.minWidth = "210mm";
    tempElement.style.maxWidth = "none";
    tempElement.style.margin = "0 auto";
    tempElement.style.fontSize = "14px";
    tempElement.style.position = "fixed";
    tempElement.style.left = "-9999px";
    tempElement.style.top = "0";

    tempElement.style.backgroundColor = currentTheme === "dark" ? "#0d1117" : "#ffffff";
    tempElement.style.color = currentTheme === "dark" ? "#c9d1d9" : "#24292e";

    document.body.appendChild(tempElement);
    await new Promise(resolve => setTimeout(resolve, 200));

    try {
      if (window.mermaid) {
        await withTimeout(
          window.mermaid.run({ nodes: tempElement.querySelectorAll('.mermaid'), suppressErrors: true }),
          3000,
          "Mermaid rendering timed out"
        );
      }
    } catch (mermaidError) {
      console.warn("Mermaid rendering issue:", mermaidError);
    }

    if (window.MathJax) {
      try {
        if (typeof MathJax.typesetPromise === 'function') {
          await withTimeout(
            MathJax.typesetPromise([tempElement]),
            3000,
            "MathJax typesetting timed out"
          );
        } else if (MathJax.startup && MathJax.startup.promise) {
          await withTimeout(
            MathJax.startup.promise,
            3000,
            "MathJax startup timed out"
          );
          if (typeof MathJax.typesetPromise === 'function') {
            await withTimeout(
              MathJax.typesetPromise([tempElement]),
              3000,
              "MathJax typesetting timed out"
            );
          }
        }
      } catch (mathJaxError) {
        console.warn("MathJax rendering issue:", mathJaxError);
      }
      const assistiveElements = tempElement.querySelectorAll('mjx-assistive-mml');
      assistiveElements.forEach(el => {
        el.style.display = 'none';
        el.style.visibility = 'hidden';
        el.style.position = 'absolute';
        el.style.width = '0';
        el.style.height = '0';
        el.style.overflow = 'hidden';
        el.remove();
      });
      const mathScripts = tempElement.querySelectorAll('script[type*="math"], script[type*="tex"]');
      mathScripts.forEach(el => el.remove());
    }

    await new Promise(resolve => setTimeout(resolve, 500));

    const pageBreakAnalysis = applyPageBreaksWithCascade(tempElement, PAGE_CONFIG);
    if (pageBreakAnalysis.oversizedElements && pageBreakAnalysis.pageHeightPx) {
      handleOversizedElements(pageBreakAnalysis.oversizedElements, pageBreakAnalysis.pageHeightPx);
    }

    const pdfOptions = { orientation: 'portrait', unit: 'mm', format: 'a4', compress: true, hotfixes: ["px_scaling"] };
    const pdf = new window.jspdf.jsPDF(pdfOptions);
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 15;
    const contentWidth = pageWidth - (margin * 2);

    const originalGetComputedStyle = window.getComputedStyle;
    window.getComputedStyle = function(el, pseudoEl) {
      const style = originalGetComputedStyle.call(window, el, pseudoEl);
      return new Proxy(style, {
        get(target, prop) {
          if (prop === 'getPropertyValue') {
            return function(propertyName) {
              const value = target.getPropertyValue.call(target, propertyName);
              if (typeof value === 'string' && /(oklch|oklab|lab|lch)\([^)]+\)/i.test(value)) {
                return value.replace(/(oklch|oklab|lab|lch)\([^)]+\)/gi, 'rgb(0, 0, 0)');
              }
              return value;
            };
          }
          const value = Reflect.get(target, prop);
          if (typeof value === 'function') {
            return value.bind(target);
          }
          if (typeof value === 'string' && /(oklch|oklab|lab|lch)\([^)]+\)/i.test(value)) {
            return value.replace(/(oklch|oklab|lab|lch)\([^)]+\)/gi, 'rgb(0, 0, 0)');
          }
          return value;
        }
      });
    };

    let canvas;
    try {
      canvas = await withTimeout(
        window.html2canvas(tempElement, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          logging: false,
          windowWidth: 1000,
          windowHeight: tempElement.scrollHeight
        }),
        10000,
        "html2canvas rendering timed out"
      );
    } finally {
      window.getComputedStyle = originalGetComputedStyle;
    }

    const scaleFactor = canvas.width / contentWidth;
    if (scaleFactor <= 0 || !isFinite(scaleFactor)) {
      throw new Error(`Invalid canvas scale factor (width: ${canvas.width}, contentWidth: ${contentWidth})`);
    }
    const imgHeight = canvas.height / scaleFactor;
    const pagesCount = Math.ceil(imgHeight / (pageHeight - margin * 2));
    if (pagesCount <= 0 || !isFinite(pagesCount)) {
      throw new Error(`Invalid page count computed: ${pagesCount}`);
    }

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
    setTimeout(() => document.body.removeChild(progressContainer), 1500);
    document.body.removeChild(tempElement);
    exportPdfBtn.innerHTML = originalText;
    exportPdfBtn.disabled = false;

  } catch (error) {
    console.error("PDF export failed:", error);
    alert("PDF export failed: " + error.message);
    exportPdfBtn.innerHTML = '<i class="bi bi-file-earmark-pdf"></i> Export';
    exportPdfBtn.disabled = false;
    const progressContainer = document.querySelector('div[style*="Generating PDF"]');
    if (progressContainer) document.body.removeChild(progressContainer);
  }
}
