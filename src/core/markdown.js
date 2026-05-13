
export function initMermaid() {
  const currentTheme = document.documentElement.getAttribute("data-theme");
  const mermaidTheme = currentTheme === "dark" ? "dark" : "default";

  mermaid.initialize({
    startOnLoad: false,
    theme: mermaidTheme,
    securityLevel: "loose",
    flowchart: { useMaxWidth: true, htmlLabels: true },
    fontSize: 16,
  });
}

export function initMarkdownParser() {

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
  if (language === "mermaid") {
    const uniqueId =
      "mermaid-diagram-" + Math.random().toString(36).substr(2, 9);

    // Workaround for Mermaid v11+ "Unsupported markdown: list" error in flowcharts
    // Only apply to flowchart/graph types to avoid mangling quadrantChart, requirementDiagram, etc.
    let fixedCode = code;
    const isFlowchart = /^\s*(flowchart|graph)\b/i.test(code);
    if (isFlowchart) {
      fixedCode = code
        .replace(/(\b\d+\.)\s+/g, "$1&nbsp;")
        .replace(/(^|[\[\(|]\s*)([-*+])\s+/g, "$1$2&nbsp;");
    }
    const escapeHtml = (unsafe) => {
      return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    };

    return `<div class="mermaid-container"><pre class="mermaid" id="${uniqueId}">${escapeHtml(fixedCode)}</pre></div>`;
  }
  
  if (language === "plantuml" || language === "puml") {
    if (window.plantumlEncoder) {
      const encoded = window.plantumlEncoder.encode(code);
      return `<div class="plantuml-container" style="text-align: center; margin: 1.5em 0;">
                <img src="https://www.plantuml.com/plantuml/svg/${encoded}" alt="PlantUML Diagram" style="max-width: 100%; height: auto; border-radius: 4px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);" />
              </div>`;
    }
  }

  if (language === "drawio") {
    // Escape quotes to put XML in data-mxgraph attribute
    const escapedXml = code.replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const graphConfig = `{"highlight":"#0366d6","nav":true,"resize":true,"toolbar":"zoom layers tags lightbox","edit":"_blank","xml":"${escapedXml}"}`;
    return `<div class="mxgraph-container" style="text-align: center; margin: 1.5em 0;">
              <div class="mxgraph" style="max-width:100%;border:1px solid var(--border-color);border-radius:6px;background:var(--preview-bg);" data-mxgraph="${graphConfig}"></div>
            </div>`;
  }

  const validLanguage = hljs.getLanguage(language) ? language : "plaintext";
  const highlightedCode = hljs.highlight(code, {
    language: validLanguage,
  }).value;
  return `<pre><code class="hljs ${validLanguage}">${highlightedCode}</code></pre>`;
};

renderer.link = function (href, title, text) {
  const link = marked.Renderer.prototype.link.call(this, href, title, text);
  if (href && !href.startsWith("#")) {
    return link.replace("<a ", '<a target="_blank" rel="noopener noreferrer" ');
  }
  return link;
};

marked.setOptions({
  ...markedOptions,
  renderer: renderer,
});

// Auto-detect raw Mermaid syntax pasted without code blocks
const originalMarkedParse = marked.parse;
marked.parse = function (mdString, options) {
  try {
    let lines = mdString.split("\n");
    let newLines = [];
    let inMermaid = false;
    let inCodeBlock = false;

    const mermaidStart =
      /^(flowchart|sequenceDiagram|classDiagram|stateDiagram|stateDiagram-v2|erDiagram|journey|gantt|pie|gitGraph|mindmap|timeline|graph|architecture-beta|architecture|sankey-beta|xychart-beta|block-beta|packet-beta|ishikawa|quadrantChart|requirementDiagram|C4Context|C4Container|C4Component|C4Dynamic|C4Deployment)\b/i;

    const looksLikeMermaid = (l) => {
      const t = l.trim();
      if (!t) return true;
      if (/^[ \t]/.test(l)) return true; // indented
      if (
        /^(subgraph|end|click|style|class|classDef|linkStyle|direction|note|participant|actor|activate|deactivate|group|service|title|x-axis|y-axis|quadrant-\d|requirement|functionalRequirement|performanceRequirement|interfaceRequirement|designConstraint|element|contains|copies|derives|satisfies|verifies|refines|traces|columns|space|Person|Person_Ext|System|System_Ext|SystemDb|SystemQueue|Container|Container_Ext|ContainerDb|ContainerQueue|ContainerExt|Component|Component_Ext|ComponentDb|ComponentQueue|Rel|Rel_U|Rel_D|Rel_L|Rel_R|Rel_Back|BiRel|Boundary|Enterprise_Boundary|System_Boundary|Container_Boundary|UpdateElementStyle|UpdateRelStyle|UpdateLayoutConfig)\b/i.test(
          t,
        )
      )
        return true;
      if (/[-\=]+\>/.test(t) || t.includes("---") || t.includes("==="))
        return true;
      if (/\[.*\]|\(.*\)|{.*}|>.*\]/.test(t)) return true;
      if (t.includes(":")) return true;
      if (/^"[^"]+"\s*:\s*\[/.test(t)) return true; // quadrantChart data entries
      if (/^[A-Za-z0-9_]+$/.test(t)) return true;
      // sankey syntax
      if (t.split(",").length >= 3 && !isNaN(parseFloat(t.split(",").pop())))
        return true;
      return false;
    };

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];

      if (line.trim().startsWith("\`\`\`")) {
        inCodeBlock = !inCodeBlock;
        newLines.push(line);
        continue;
      }

      if (!inCodeBlock && !inMermaid && mermaidStart.test(line.trim())) {
        inMermaid = true;
        newLines.push("\`\`\`mermaid");
        newLines.push(line);
        continue;
      }

      if (inMermaid) {
        if (/^(#{1,6}\s|\-\-\-|> \s|\*\s|\-\s|\d+\.\s)/.test(line)) {
          newLines.push("\`\`\`");
          inMermaid = false;
          newLines.push(line);
          continue;
        }

        if (i > 0 && lines[i - 1].trim() === "" && line.trim() !== "") {
          if (!looksLikeMermaid(line)) {
            newLines.push("\`\`\`");
            inMermaid = false;
            newLines.push(line);
            continue;
          }
        }
      }

      newLines.push(line);
    }

    if (inMermaid) {
      newLines.push("\`\`\`");
    }

    return originalMarkedParse(newLines.join("\n"), options);
  } catch (e) {
    console.warn("Markdown parsing error, fallback to original parser:", e);
    return originalMarkedParse(mdString, options);
  }
};
}
