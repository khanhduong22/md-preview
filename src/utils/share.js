
import { markdownEditor } from '../core/dom.js';
import { renderMarkdown } from '../core/render.js';
import { AppState } from '../core/state.js';
import { createTab, saveTabsToStorage, saveActiveTabId, renderTabBar } from '../core/tabs.js';
import { restoreViewMode } from './viewMode.js';
import { saveShareSnapshot } from '../core/history.js';
import { setFocusMode } from './focusMode.js';

// ============================================
// Share via URL (pako compression + base64url)
// ============================================

const MAX_SHARE_URL_LENGTH = 32000;
let isInternalShareUpdate = false;

function encodeMarkdownForShare(text) {
  const compressed = pako.deflate(new TextEncoder().encode(text));
  const chunkSize = 0x8000;
  let binary = "";
  for (let i = 0; i < compressed.length; i += chunkSize) {
    binary += String.fromCharCode.apply(
      null,
      compressed.subarray(i, i + chunkSize),
    );
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function decodeMarkdownFromShare(encoded) {
  let base64 = decodeURIComponent(encoded)
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  const binary = atob(base64);
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(pako.inflate(bytes));
}

function copyShareUrl(btn) {
  const currentTab = AppState.tabs.find((t) => t.id === AppState.activeTabId);
  const title = currentTab ? currentTab.title : "Untitled";
  saveShareSnapshot(markdownEditor.value, title);

  const markdownText = markdownEditor.value;
  let encoded;
  try {
    encoded = encodeMarkdownForShare(markdownText);
  } catch (e) {
    console.error("Share encoding failed:", e);
    alert("Failed to encode content for sharing: " + e.message);
    return;
  }

  const shareHash = `share=${encoded}&mode=preview&hide=1`;
  const shareUrl =
    window.location.origin + window.location.pathname + "#" + shareHash;
  const tooLarge = shareUrl.length > MAX_SHARE_URL_LENGTH;

  const originalHTML = btn.innerHTML;
  const copiedHTML = '<i class="bi bi-check-lg"></i> Copied!';

  function onCopied() {
    if (!tooLarge) {
      if (window.location.hash !== "#" + shareHash) {
        isInternalShareUpdate = true;
        window.location.hash = shareHash;
        setTimeout(() => {
          isInternalShareUpdate = false;
        }, 100);
      }
    }
    btn.innerHTML = copiedHTML;
    setTimeout(() => {
      btn.innerHTML = originalHTML;
    }, 2000);
  }

  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard
      .writeText(shareUrl)
      .then(onCopied)
      .catch(() => {
        // clipboard.writeText failed
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

export function initShare() {
  const shareButton = document.getElementById("share-button");
  const mobileShareButton = document.getElementById("mobile-share-button");

  if (shareButton) {
    shareButton.addEventListener("click", function () {
      copyShareUrl(shareButton);
    });
  }
  if (mobileShareButton) {
    mobileShareButton.addEventListener("click", function () {
      copyShareUrl(mobileShareButton);
    });
  }

  // Handle hash changes if the user clicks a share link while the app is already open
  window.addEventListener("hashchange", () => {
    if (isInternalShareUpdate) {
      isInternalShareUpdate = false;
      return;
    }
    if (window.location.hash.startsWith("#share=")) {
      loadFromShareHashChange();
    }
  });
}

/**
 * Extract and decode share hash from the URL.
 * Returns the decoded markdown string, or null if no share hash is present.
 */
function decodeShareHash() {
  if (typeof pako === "undefined") {
    console.error("pako is undefined. Cannot load shared content.");
    return null;
  }

  let encoded = "";
  const hash = window.location.hash;

  if (hash.startsWith("#share=")) {
    encoded = hash.slice("#share=".length);
  } else {
    const href = window.location.href;
    const shareMatch = href.match(/(?:#|%23)share=([^&?]*)/);
    if (shareMatch) {
      encoded = shareMatch[1];
    }
  }

  if (!encoded) return null;

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
    alert(
      "The shared URL could not be decoded. It may be corrupted or incomplete.",
    );
    return null;
  }
}

export function isShareHideModeFromHash() {
  const hash = window.location.hash || "";
  const href = window.location.href || "";
  const urlSource = hash || href;

  const match = urlSource.match(/(?:&|\?)(?:hide|focus)=([^&]+)/);
  if (match) {
    const val = decodeURIComponent(match[1]).toLowerCase();
    return val === "1" || val === "true";
  }

  // If not explicitly set but #share= is in the URL, return true
  if (hash.includes("share=") || href.includes("#share=") || href.includes("%23share=")) {
    return true;
  }

  return false;
}

export function getShareModeFromHash() {
  const hash = window.location.hash || window.location.href || "";
  const match = hash.match(/(?:&|\?)mode=([a-zA-Z]+)/);
  return match ? match[1] : "preview";
}

/**
 * Handle share hash changes when the app is already open.
 */
function loadFromShareHashChange() {
  const shareContent = decodeShareHash();
  if (shareContent === null) return;

  const shareTab = createTab(shareContent, "Shared Note");
  AppState.tabs.push(shareTab);
  AppState.activeTabId = shareTab.id;
  markdownEditor.value = shareContent;
  restoreViewMode(getShareModeFromHash());
  setFocusMode(isShareHideModeFromHash());
  renderMarkdown();
  saveTabsToStorage(AppState.tabs);
  saveActiveTabId(AppState.activeTabId);
  renderTabBar(AppState.tabs, AppState.activeTabId);
}

export { decodeShareHash };
