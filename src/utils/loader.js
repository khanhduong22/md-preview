const loadedScripts = new Map();
const loadedStyles = new Map();

/**
 * Dynamically load a JavaScript file on demand with promise caching.
 * @param {string} src
 * @returns {Promise<void>}
 */
export function loadScript(src) {
  if (loadedScripts.has(src)) {
    return loadedScripts.get(src);
  }

  const promise = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      if (existing.dataset.loaded === "true") {
        resolve();
        return;
      }
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", (e) => reject(e), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = () => {
      script.dataset.loaded = "true";
      resolve();
    };
    script.onerror = (e) => {
      loadedScripts.delete(src);
      reject(e);
    };
    document.head.appendChild(script);
  });

  loadedScripts.set(src, promise);
  return promise;
}

/**
 * Dynamically load a CSS stylesheet on demand with promise caching.
 * @param {string} href
 * @returns {Promise<void>}
 */
export function loadStyle(href) {
  if (loadedStyles.has(href)) {
    return loadedStyles.get(href);
  }

  const promise = new Promise((resolve, reject) => {
    const existing = document.querySelector(`link[href="${href}"]`);
    if (existing) {
      resolve();
      return;
    }

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    link.onload = () => resolve();
    link.onerror = (e) => {
      loadedStyles.delete(href);
      reject(e);
    };
    document.head.appendChild(link);
  });

  loadedStyles.set(href, promise);
  return promise;
}

// Pre-defined lazy loaders for heavy modules (Tier 1 & Tier 2)
export async function ensureMermaid() {
  if (typeof window.mermaid !== "undefined") return window.mermaid;
  await loadScript("/vendor/mermaid.min.js");
  return window.mermaid;
}

export async function ensureMathJax() {
  if (window.MathJax && window.MathJax.typesetPromise) return window.MathJax;
  if (!window.MathJax) {
    await loadScript("/vendor/mathjax-config.js");
  }
  await loadScript("/vendor/tex-svg.min.js");
  return window.MathJax;
}

export async function ensureDrawio() {
  if (window.GraphViewer) return window.GraphViewer;
  await loadScript("/vendor/viewer-static.min.js");
  return window.GraphViewer;
}

export async function ensurePlantUml() {
  if (window.plantumlEncoder) return window.plantumlEncoder;
  await loadScript("/vendor/plantuml-encoder.min.js");
  return window.plantumlEncoder;
}

export async function ensurePanzoom() {
  if (window.panzoom) return window.panzoom;
  await loadScript("/vendor/panzoom.min.js");
  return window.panzoom;
}

export async function ensureDiff() {
  if (typeof window.Diff !== "undefined") return window.Diff;
  await loadScript("/vendor/diff.min.js");
  return window.Diff;
}

export async function ensureTour() {
  if (window.driver) return window.driver;
  await Promise.all([
    loadStyle("/vendor/driver.css"),
    loadScript("/vendor/driver.js.iife.js"),
  ]);
  return window.driver;
}

export async function ensurePdfEngines() {
  const tasks = [];
  if (!window.jspdf) tasks.push(loadScript("/vendor/jspdf.umd.min.js"));
  if (!window.html2canvas) tasks.push(loadScript("/vendor/html2canvas.min.js"));
  if (tasks.length > 0) await Promise.all(tasks);
}

export async function ensureMiniSearch() {
  if (window.MiniSearch) return window.MiniSearch;
  await loadScript("/vendor/minisearch.min.js");
  return window.MiniSearch;
}

export async function ensureFileSaver() {
  if (typeof window.saveAs !== "undefined") return window.saveAs;
  await loadScript("/vendor/FileSaver.min.js");
  return window.saveAs;
}

export async function ensureJoypixels() {
  if (typeof window.joypixels !== "undefined") return window.joypixels;
  await loadScript("/vendor/joypixels.min.js");
  return window.joypixels;
}

export async function ensurePako() {
  if (typeof window.pako !== "undefined") return window.pako;
  await loadScript("/vendor/pako.min.js");
  return window.pako;
}
