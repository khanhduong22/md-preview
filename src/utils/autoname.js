/**
 * Auto-Naming & Sanitization Utilities for Markdown Documents
 * Supports Chrome Built-in AI with instant Markdown Header & Semantic NLP fallback.
 */

/**
 * Format a Date object into DDMMYY_HHmm string
 * Example: 24/08/2026 11:20 -> "240826_1120"
 * @param {Date} [date=new Date()]
 * @returns {string}
 */
export function formatDateTimestamp(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = String(d.getFullYear()).slice(-2);
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${day}${month}${year}_${hours}${minutes}`;
}

/**
 * Sanitize a string to be safely used as a filename across Windows, macOS, and Linux
 * Preserves unicode characters while stripping illegal symbols.
 * @param {string} name
 * @param {number} [maxLength=50]
 * @returns {string}
 */
export function sanitizeFileName(name, maxLength = 50) {
  if (!name || typeof name !== 'string') return 'Untitled';
  
  let clean = name
    .replace(/[\\/:*?"<>|\x00-\x1F\x7F]/g, '-') // Replace illegal OS chars
    .replace(/[\t\r\n]+/g, ' ')                  // Replace newlines with spaces
    .replace(/\s+/g, ' ')                        // Collapse multiple spaces
    .replace(/-+/g, '-')                         // Collapse multiple dashes
    .trim();

  // Strip leading/trailing dashes and dots
  clean = clean.replace(/^[.\s-]+|[.\s-]+$/g, '');

  if (clean.length > maxLength) {
    clean = clean.slice(0, maxLength).trim().replace(/[.\s-]+$/, '');
  }

  return clean || 'Untitled';
}

/**
 * Strip basic markdown formatting from a text snippet
 * @param {string} text
 * @returns {string}
 */
function stripMarkdownFormatting(text) {
  return text
    .replace(/!\[.*?\]\(.*?\)/g, '')          // Images
    .replace(/\[(.*?)\]\(.*?\)/g, '$1')        // Links
    .replace(/`{1,3}(.*?)`{1,3}/g, '$1')       // Inline / block code
    .replace(/(\*\*|__)(.*?)\1/g, '$2')        // Bold
    .replace(/(\*|_)(.*?)\1/g, '$2')          // Italic
    .replace(/~~(.*?)~~/g, '$1')               // Strikethrough
    .replace(/^>+\s*/g, '')                    // Blockquotes
    .replace(/^[*\-+]\s+/g, '')                // Unordered list items
    .replace(/^\d+\.\s+/g, '')                 // Ordered list items
    .replace(/[:#]/g, ' ')                     // Header hashes and colons
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extract smart title from Markdown content via Heuristics
 * Priority:
 * 1. YAML Frontmatter (`title: ...`)
 * 2. Markdown H1 (`# Title`)
 * 3. Markdown H2 (`## Title`)
 * 4. First meaningful non-empty line
 * @param {string} content
 * @returns {string|null}
 */
export function extractMarkdownTitle(content) {
  if (!content || typeof content !== 'string') return null;
  const trimmed = content.trim();
  if (!trimmed) return null;

  // 1. YAML Frontmatter: title: "..." or title: ...
  const frontmatterMatch = trimmed.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (frontmatterMatch) {
    const yamlBody = frontmatterMatch[1];
    const titleMatch = yamlBody.match(/^title:\s*["']?([^"'\r\n]+)["']?/m);
    if (titleMatch && titleMatch[1].trim()) {
      return sanitizeFileName(stripMarkdownFormatting(titleMatch[1]), 50);
    }
  }

  // 2. Markdown H1: # Title (ignore # inside code fences)
  const h1Match = trimmed.match(/^#\s+([^\r\n]+)/m);
  if (h1Match && h1Match[1].trim()) {
    const title = stripMarkdownFormatting(h1Match[1]);
    if (title) return sanitizeFileName(title, 50);
  }

  // 3. Markdown H2: ## Title
  const h2Match = trimmed.match(/^##\s+([^\r\n]+)/m);
  if (h2Match && h2Match[1].trim()) {
    const title = stripMarkdownFormatting(h2Match[1]);
    if (title) return sanitizeFileName(title, 50);
  }

  // 4. Setext style H1/H2: Line followed by === or ---
  const setextMatch = trimmed.match(/^([^\r\n]+)\r?\n(?:={3,}|-{3,})$/m);
  if (setextMatch && setextMatch[1].trim()) {
    const title = stripMarkdownFormatting(setextMatch[1]);
    if (title) return sanitizeFileName(title, 50);
  }

  // 5. First meaningful line (skip markdown tables, code fences, thematic breaks)
  const lines = trimmed.split(/\r?\n/);
  for (const line of lines) {
    const lineTrimmed = line.trim();
    if (!lineTrimmed) continue;
    if (lineTrimmed.startsWith('```') || lineTrimmed.startsWith('---') || lineTrimmed.startsWith('***') || lineTrimmed.startsWith('===')) continue;
    if (lineTrimmed.startsWith('|') && lineTrimmed.endsWith('|')) continue; // Table row
    
    const clean = stripMarkdownFormatting(lineTrimmed);
    if (clean.length >= 3) {
      return sanitizeFileName(clean, 40);
    }
  }

  return null;
}

/**
 * Asynchronously generates a smart document title
 * Tries in-browser AI (Chrome Prompt API / Gemini Nano) first with timeout,
 * and falls back immediately to Markdown Header / Heuristic extraction.
 * @param {string} content
 * @param {string} [currentTitle='Untitled']
 * @returns {Promise<string>}
 */
export async function generateSmartTitle(content, currentTitle = 'Untitled') {
  if (!content || typeof content !== 'string' || !content.trim()) {
    return currentTitle || 'Untitled';
  }

  // Extract heuristic title as baseline fallback
  const heuristicTitle = extractMarkdownTitle(content) || currentTitle || 'Untitled';

  // Attempt Chrome Built-in AI (window.ai.languageModel) if available
  if (typeof window !== 'undefined' && window.ai && window.ai.languageModel) {
    try {
      const aiPromise = (async () => {
        const capabilities = await window.ai.languageModel.capabilities();
        if (capabilities && (capabilities.available === 'readily' || capabilities.available === 'after-download')) {
          const session = await window.ai.languageModel.create({
            systemPrompt: 'You generate a short, concise document title (3 to 5 words maximum, in the same language as the text, without quotes or markdown formatting) for the given markdown content.'
          });
          const snippet = content.slice(0, 1200);
          const aiResult = await session.prompt(`Document content:\n${snippet}\n\nConcise Title:`);
          if (session.destroy) session.destroy();
          if (aiResult && typeof aiResult === 'string') {
            const cleanAiTitle = sanitizeFileName(stripMarkdownFormatting(aiResult), 45);
            if (cleanAiTitle && cleanAiTitle !== 'Untitled') {
              return cleanAiTitle;
            }
          }
        }
        return heuristicTitle;
      })();

      // Fast timeout (1.5 seconds) to avoid delaying user experience
      const timeoutPromise = new Promise(resolve => setTimeout(() => resolve(heuristicTitle), 1500));
      return await Promise.race([aiPromise, timeoutPromise]);
    } catch (e) {
      console.warn('AI title generation fallback triggered:', e);
      return heuristicTitle;
    }
  }

  return heuristicTitle;
}

/**
 * Check if a given title is an auto-generated Untitled title
 * @param {string} title
 * @returns {boolean}
 */
export function isUntitledTab(title) {
  if (!title || typeof title !== 'string') return true;
  const t = title.trim();
  return /^Untitled(\s+\d+)?$/i.test(t) || t === 'Untitled';
}
