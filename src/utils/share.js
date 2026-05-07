
import { markdownEditor } from '../core/dom.js';
import { renderMarkdown } from '../core/render.js';
import { AppState } from '../core/state.js';
import { createTab, saveTabsToStorage, saveActiveTabId, renderTabBar, restoreViewMode } from '../core/tabs.js';
import { saveShareSnapshot } from '../core/history.js';

// ============================================
// Share via URL (pako compression + base64url)
// ============================================

const MAX_SHARE_URL_LENGTH = 32000;

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
  // Add missing padding to prevent atob InvalidCharacterError in some browsers
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

  const shareUrl =
    window.location.origin + window.location.pathname + "#share=" + encoded;
  const tooLarge = shareUrl.length > MAX_SHARE_URL_LENGTH;

  const originalHTML = btn.innerHTML;
  const copiedHTML = '<i class="bi bi-check-lg"></i> Copied!';

  function onCopied() {
    if (!tooLarge) {
      window.location.hash = "share=" + encoded;
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

shareButton.addEventListener("click", function () {
  copyShareUrl(shareButton);
});
mobileShareButton.addEventListener("click", function () {
  copyShareUrl(mobileShareButton);
});

/**
 * Extract and decode share hash from the URL.
 * Returns the decoded markdown string, or null if no share hash is present.
 * This is a pure decoder — it does NOT touch the editor or AppState.tabs.
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
    alert(
      "The shared URL could not be decoded. It may be corrupted or incomplete.",
    );
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

  const shareTab = createTab(shareContent, "Shared Note");
  AppState.tabs.push(shareTab);
  AppState.activeTabId = shareTab.id;
  markdownEditor.value = shareContent;
  restoreViewMode("split");
  renderMarkdown();
  saveTabsToStorage(AppState.tabs);
  saveActiveTabId(AppState.activeTabId);
  renderTabBar(AppState.tabs, AppState.activeTabId);
}

// Handle hash changes if the user clicks a share link while the app is already open
window.addEventListener("hashchange", () => {
  if (window.location.hash.startsWith("#share=")) {
    loadFromShareHashChange();
  }
});

export { decodeShareHash };
