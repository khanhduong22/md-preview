import { ensureJoypixels } from "./loader.js";

const CANDIDATE_REGEX = /:[\w+-]+:/;
const SHORTCODE_REGEX = /:([\w+-]+):/g;

export async function processEmojis(element) {
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
    
    if (!isInCode && CANDIDATE_REGEX.test(node.nodeValue)) {
      textNodes.push(node);
    }
  }

  if (textNodes.length === 0) return;

  await ensureJoypixels();
  if (typeof joypixels === "undefined" || !joypixels.shortnameToUnicode) return;

  textNodes.forEach(textNode => {
    if (!textNode.parentNode) return;
    const text = textNode.nodeValue;
    SHORTCODE_REGEX.lastIndex = 0;
    
    let match;
    let lastIndex = 0;
    let result = '';
    let hasEmoji = false;
    
    while ((match = SHORTCODE_REGEX.exec(text)) !== null) {
      const shortcode = match[1];
      const emoji = joypixels.shortnameToUnicode(`:${shortcode}:`);
      
      if (emoji !== `:${shortcode}:`) { // If conversion was successful
        hasEmoji = true;
        result += text.substring(lastIndex, match.index) + emoji;
        lastIndex = SHORTCODE_REGEX.lastIndex;
      } else {
        result += text.substring(lastIndex, SHORTCODE_REGEX.lastIndex);
        lastIndex = SHORTCODE_REGEX.lastIndex;
      }
    }
    
    if (hasEmoji) {
      result += text.substring(lastIndex);
      const span = document.createElement('span');
      span.innerHTML = result;
      if (textNode.parentNode) {
        textNode.parentNode.replaceChild(span, textNode);
      }
    }
  });
}

  