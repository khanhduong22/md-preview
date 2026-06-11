import { AppState } from "../core/state.js";
import { setViewMode, isSplitReversed, currentViewMode } from "./viewMode.js";
export function startTour() {
    if (!window.driver) return;
    
    // Tạm ẩn privacy banner để không làm lệch vị trí popover
    const privacyNotice = document.getElementById('privacy-notice');
    const privacyDismiss = document.getElementById('privacy-dismiss');
    if (privacyNotice && privacyNotice.style.display !== 'none') {
      if (privacyDismiss) privacyDismiss.click();
      else privacyNotice.style.display = 'none';
    }

    // Đảm bảo ở chế độ split để cả Editor và Preview đều hiển thị trong quá trình Tour
    if (currentViewMode !== 'split') {
      setViewMode('split');
    }

    const driverObj = window.driver.js.driver({
      showProgress: true,
      animate: true,
      allowClose: true,
      nextBtnText: 'Next ➔',
      prevBtnText: '⬅ Back',
      doneBtnText: 'Done ✔',
      steps: [
        {
          popover: {
            title: 'Welcome to 2ndBrain! 🚀',
            description: 'Welcome to the premium Markdown Editor. Let\'s spend 1 minute to explore the outstanding features!',
            align: 'center'
          }
        },
        {
          element: '#sidebar-toc',
          popover: {
            title: 'Automatic Outline 📑',
            description: 'Automatically generates a table of contents based on Heading tags (H1, H2...). Click to jump quickly to the content.',
            side: "right", align: 'start'
          }
        },
        {
          element: '#open-vault-btn',
          popover: {
            title: 'Connect Local Folder (Vault) 📂',
            description: 'A highly powerful feature! Grant the browser permission to read/write directly to a folder on your computer. Exactly how Obsidian works!',
            side: "left", align: 'start'
          }
        },
        {
          element: '#sidebar-explorer',
          popover: {
            title: 'Local File Manager 🗂️',
            description: 'Your entire directory tree and documents will be shown here. Absolute privacy: no data is sent to external servers.',
            side: "left", align: 'start'
          }
        },
        {
          element: '.tab-bar',
          popover: {
            title: 'Tabs & Tab Groups 📑',
            description: 'Open multiple files at once, color-code/group tabs together, just like Google Chrome!',
            side: "bottom", align: 'start'
          }
        },
        {
          element: '#tag-filter-btn',
          popover: {
            title: 'Filter by Tag 🏷️',
            description: 'Just type #tag in your document; the system will auto-detect and let you filter files quickly here.',
            side: "bottom", align: 'end'
          }
        },
        {
          element: '#tab-reset-btn',
          popover: {
            title: 'Reset All 🗑️',
            description: 'If you want to completely clean up the current cache and start fresh, click this button.',
            side: "bottom", align: 'end'
          }
        },
        {
          element: '.editor-pane',
          popover: {
            title: 'High-speed Editing ⚡',
            description: 'Write Markdown here. You can drag & drop images or paste them directly. Remember to use Ctrl+S to save!',
            side: "right", align: 'start'
          }
        },
        {
          element: '.preview-pane',
          popover: {
            title: 'Real-time Preview 👁️',
            description: 'See the results instantly. Supports Mathematics (MathJax), Syntax Highlighting (Highlight.js), and up to 30 types of diagrams (Mermaid.js)!',
            side: "left", align: 'start'
          }
        },
        {
          element: '.view-mode-group',
          popover: {
            title: 'Display Modes 🪟',
            description: 'Code only, Split view, or Preview only. Click the "Hide" button to hide the header and focus completely.',
            side: "bottom", align: 'center'
          }
        },
        {
          element: '#toggle-sync',
          popover: {
            title: 'Synchronized Scrolling ↕️',
            description: 'Synchronize scrolling between the Editor and Preview, ensuring you never lose track of your current line.',
            side: "bottom", align: 'start'
          }
        },
        {
          element: '#import-button',
          popover: {
            title: 'Import File 📤',
            description: 'Quickly load a Markdown file (.md) from your computer into the editor.',
            side: "bottom", align: 'start'
          }
        },
        {
          element: '#exportDropdown',
          popover: {
            title: 'Import/Export Options 📥',
            description: 'Export to HTML, PDF, Markdown, or download a full JSON backup of all files.',
            side: "bottom", align: 'start'
          }
        },
        {
          element: '#copy-markdown-button',
          popover: {
            title: 'Copy Markdown 📋',
            description: 'Quickly copy the entire Markdown content to your clipboard in a single click.',
            side: "bottom", align: 'start'
          }
        },
        {
          element: '#share-button',
          popover: {
            title: 'Serverless Sharing 🔗',
            description: 'Compresses your document into a sharing link. Friends can view it instantly without any database or sign-in!',
            side: "bottom", align: 'end'
          }
        },
        {
          element: '#search-btn',
          popover: {
            title: 'Global Search 🔍',
            description: 'Press Ctrl+K to search your notes instantly across all files in your Vault.',
            side: "bottom", align: 'end'
          }
        },
        {
          element: '#history-btn',
          popover: {
            title: 'Version History ⏱️',
            description: 'Accidentally deleted something? The system automatically saves version checkpoints so you can easily restore previous drafts.',
            side: "bottom", align: 'end'
          }
        },
        {
          element: '#docThemeDropdown',
          popover: {
            title: 'Document Themes 🎨',
            description: 'Instantly style your documents with professional theme layouts, ranging from Academic to Hacker.',
            side: "bottom", align: 'end'
          }
        },
        {
          element: '#tour-btn',
          popover: {
            title: 'Help & Tour ❓',
            description: 'You can replay this guided tour at any time by clicking this button. Happy writing!',
            side: "left", align: 'center'
          }
        }
      ]
    });
    driverObj.drive();
  }
export function initTour() {
  const tourBtn = document.getElementById("tour-btn");
  if (tourBtn) {
    tourBtn.addEventListener("click", startTour);
  }

  const hasSeenTour = localStorage.getItem("hasSeenTour");
  if (!hasSeenTour && window.innerWidth >= 768) {
    setTimeout(() => {
      startTour();
      localStorage.setItem("hasSeenTour", "true");
    }, 1000);
  }
}
