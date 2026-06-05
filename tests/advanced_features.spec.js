import { test, expect } from '@playwright/test';

test.describe('Advanced Features E2E Suite', () => {
  test.beforeEach(async ({ page }) => {
    // Enable browser console and error logging redirection
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', err => console.log('PAGE ERROR:', err.message, err.stack));

    // Dismiss tour and privacy banner on page load
    await page.addInitScript(() => {
      localStorage.setItem('hasSeenTour', 'true');
      localStorage.setItem('kido-privacy-dismissed', '1');
    });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should toggle focus mode when clicking control buttons or pressing Escape', async ({ page }) => {
    const focusModeBtn = page.locator('#focus-mode-btn');
    await expect(focusModeBtn).toBeVisible();

    // 1. Toggle Focus Mode On
    await focusModeBtn.click();
    await expect(page.locator('body')).toHaveClass(/focus-mode/);

    // 2. Toggle Focus Mode Off via Reveal Button
    const exitFocusBtn = page.locator('#exit-focus-btn');
    await expect(exitFocusBtn).toBeVisible();
    await page.locator('#header-reveal-zone').hover();
    await page.waitForTimeout(500); // Wait for CSS hover transition
    await exitFocusBtn.click();
    await expect(page.locator('body')).not.toHaveClass(/focus-mode/);

    // 3. Toggle Focus Mode On again, then exit via Escape key
    await focusModeBtn.click();
    await expect(page.locator('body')).toHaveClass(/focus-mode/);
    await page.keyboard.press('Escape');
    await expect(page.locator('body')).not.toHaveClass(/focus-mode/);
  });

  test('should open search panel, find matching tabs, and navigate to results', async ({ page }) => {
    // 1. Pre-populate localforage with search-friendly mock tabs
    await page.evaluate(async () => {
      const mockTabs = [
        { id: 'tab-target', title: 'Target Search Note', content: 'SecretContentHere12345', pinned: false },
        { id: 'tab-filler', title: 'Normal Page', content: 'Some ordinary text content', pinned: false }
      ];
      await localforage.setItem('markdownViewerTabs', mockTabs);
      await localforage.setItem('markdownViewerActiveTabId', 'tab-filler');
    });

    // Reload to bootstrap state
    await page.reload();
    await page.waitForLoadState('networkidle');

    // 2. Trigger search modal
    const searchBtn = page.locator('#search-btn');
    await searchBtn.click();

    const searchOverlay = page.locator('#search-overlay');
    await expect(searchOverlay).toBeVisible();

    // 3. Type query and verify result item
    const searchInput = page.locator('#search-input');
    await searchInput.fill('SecretContent');

    const resultItem = page.locator('.search-result-item');
    await expect(resultItem).toBeVisible();
    await expect(resultItem.locator('.search-result-title')).toContainText('Target Search Note');
    await expect(resultItem.locator('.search-result-snippet mark')).toContainText('SecretContent');

    // 4. Click result and verify active tab and content change
    await resultItem.click();
    await expect(searchOverlay).not.toBeVisible();

    const editor = page.locator('#markdown-editor');
    await expect(editor).toHaveValue('SecretContentHere12345');

    // 5. Open and close search overlay using Escape key
    await page.keyboard.press('Control+k');
    await expect(searchOverlay).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(searchOverlay).not.toBeVisible();
  });

  test('should parse mermaid diagram and trigger panzoom modal controls', async ({ page }) => {
    const editor = page.locator('#markdown-editor');
    // Populate with valid Mermaid markup
    await editor.fill('```mermaid\nflowchart TD\n  StartNode[Start] --> EndNode[End]\n```');
    
    // Wait for the render delay and mermaid processing
    await page.waitForTimeout(1500);

    // Verify container and toolbar rendering
    const container = page.locator('.mermaid-container');
    await expect(container).toBeVisible();

    const toolbar = container.locator('.mermaid-toolbar');
    await expect(toolbar).toBeVisible();

    // Trigger zoom view modal by clicking fullscreen icon
    const zoomIconBtn = toolbar.locator('button[title="Zoom diagram"]');
    await zoomIconBtn.click();

    const zoomModal = page.locator('#mermaid-zoom-modal');
    await expect(zoomModal).toHaveClass(/active/);

    // Click interactive zoom controls
    const zoomIn = page.locator('#mermaid-modal-zoom-in');
    await zoomIn.click();
    
    const zoomOut = page.locator('#mermaid-modal-zoom-out');
    await zoomOut.click();

    const zoomReset = page.locator('#mermaid-modal-zoom-reset');
    await zoomReset.click();

    // Close zoom view modal
    const closeBtn = page.locator('#mermaid-modal-close');
    await closeBtn.click();
    await expect(zoomModal).not.toHaveClass(/active/);
  });

  test('should trigger PDF download using mocked canvas/pdf engines', async ({ page }) => {
    // Fill content
    const editor = page.locator('#markdown-editor');
    await editor.fill('# Title\n\nThis is some content for A4 export page-break testing.');
    await page.waitForTimeout(500);

    // Overwrite the engines using page.evaluate after page load finishes
    await page.evaluate(() => {
      window.MathJax = {
        typesetPromise: async () => {}
      };
      window.mermaid = {
        run: async () => {}
      };
      window.jspdf = {
        jsPDF: function () {
          return {
            internal: { pageSize: { getWidth: () => 210, getHeight: () => 297 } },
            addPage: () => {},
            addImage: () => {},
            save: function (name) {
              const blob = new Blob(['%PDF-1.4 mock content'], { type: 'application/pdf' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = name || 'document.pdf';
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
            }
          };
        }
      };
      window.html2canvas = async function () {
        const canvas = document.createElement('canvas');
        canvas.width = 400;
        canvas.height = 600;
        return canvas;
      };
    });

    // Click export PDF option
    const exportDropdown = page.locator('#exportDropdown');
    await exportDropdown.click();

    const downloadPromise = page.waitForEvent('download');
    const exportPdfBtn = page.locator('#export-pdf');
    await exportPdfBtn.click();

    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('document.pdf');
  });

  test('should mock Native File System Vault explorer, handle file actions, and sync virtual tabs', async ({ page }) => {
    // 1. Populate mock virtual tab backups in localforage for sync test before reloading
    await page.evaluate(async () => {
      const backupTabs = [
        { id: 'virtual-tab-1', title: 'Virtual To Sync', content: 'Sync Content', pinned: false }
      ];
      await localforage.setItem('md-preview-tabs', JSON.stringify(backupTabs));
    });

    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // 2. Inject directory handle mock architecture and wrap localforage post-reload
    await page.evaluate(async () => {
      const { AppState } = await import(window.location.origin + '/src/core/state.js');
      AppState.tabs = [];

      const mockFileHandle = (name, content = '') => ({
        kind: 'file',
        name,
        getFile: async () => ({
          text: async () => content,
          arrayBuffer: async () => new TextEncoder().encode(content).buffer
        }),
        createWritable: async () => {
          let written = '';
          return {
            write: async (data) => {
              if (typeof data === 'string') written += data;
              else if (data instanceof ArrayBuffer) written += new TextDecoder().decode(data);
              else written += data;
            },
            close: async () => {
              content = written;
            }
          };
        }
      });

      const mockDirectoryHandle = (name, children = {}) => {
        const handle = {
          kind: 'directory',
          name,
          queryPermission: async () => 'granted',
          requestPermission: async () => 'granted',
          entries: async function* () {
            for (const [key, value] of Object.entries(children)) {
              yield [key, value];
            }
          },
          getFileHandle: async (fileName, options = {}) => {
            if (!children[fileName]) {
              if (options.create) {
                children[fileName] = mockFileHandle(fileName, '');
              } else {
                throw new Error('File not found');
              }
            }
            return children[fileName];
          },
          getDirectoryHandle: async (dirName, options = {}) => {
            if (!children[dirName]) {
              if (options.create) {
                children[dirName] = mockDirectoryHandle(dirName, {});
              } else {
                throw new Error('Directory not found');
              }
            }
            return children[dirName];
          },
          removeEntry: async (entryName) => {
            delete children[entryName];
          }
        };
        return handle;
      };

      const mockVault = mockDirectoryHandle('root-vault', {
        'vault_note1.md': mockFileHandle('vault_note1.md', '# Vault Note 1\nContent of vault note 1.'),
        'vault_note2.md': mockFileHandle('vault_note2.md', '# Vault Note 2\nContent of vault note 2.'),
        'subfolder': mockDirectoryHandle('subfolder', {
          'sub_note.md': mockFileHandle('sub_note.md', '# Sub note\nSub note content.')
        })
      });

      window.showDirectoryPicker = async () => {
        return mockVault;
      };

      const lf = window.localforage;
      if (lf) {
        const originalSetItem = lf.setItem;
        const originalGetItem = lf.getItem;
        let mockVaultHandle = null;

        lf.setItem = async function (key, value) {
          if (key === 'kido-vault-handle') {
            mockVaultHandle = value;
            return originalSetItem.call(this, key, '__MOCK_VAULT_HANDLE__');
          }
          return originalSetItem.call(this, key, value);
        };

        lf.getItem = async function (key) {
          if (key === 'kido-vault-handle') {
            return mockVaultHandle || mockVault;
          }
          return originalGetItem.call(this, key);
        };
      }
    });

    // 2. Open Local Folder (trigger showDirectoryPicker)
    const openVaultBtn = page.locator('#open-vault-btn');
    await openVaultBtn.click();
    await page.waitForTimeout(500);

    // Verify tree elements
    const fileTree = page.locator('#file-tree');
    await expect(fileTree.locator('.tree-node:has-text("vault_note1.md")')).toBeVisible();
    await expect(fileTree.locator('.tree-node:has-text("vault_note2.md")')).toBeVisible();
    await expect(fileTree.locator('.tree-node:has-text("subfolder")')).toBeVisible();

    // 3. Open vault file tab by clicking on vault_note1.md node
    await fileTree.locator('.tree-node:has-text("vault_note1.md")').click();
    await page.waitForTimeout(200);

    const activeTab = page.locator('.tab-item.active');
    await expect(activeTab).toContainText('vault_note1.md');

    const editor = page.locator('#markdown-editor');
    await expect(editor).toHaveValue('# Vault Note 1\nContent of vault note 1.');

    // 4. Create new file via explorer panel action
    await page.evaluate(() => {
      window.prompt = () => 'added_file.md';
    });
    const rootNewFileBtn = page.locator('#root-new-file-btn');
    await rootNewFileBtn.click();
    await page.waitForTimeout(300);
    await expect(fileTree.locator('.tree-node:has-text("added_file.md")')).toBeVisible();

    // 5. Create new folder via explorer panel action
    await page.evaluate(() => {
      window.prompt = () => 'added_folder';
    });
    const rootNewFolderBtn = page.locator('#root-new-folder-btn');
    await rootNewFolderBtn.click();
    await page.waitForTimeout(300);
    await expect(fileTree.locator('.tree-node:has-text("added_folder")')).toBeVisible();

    // 6. Sync virtual notes to Vault
    const syncBtn = page.locator('#sync-vault-btn');
    await expect(syncBtn).toBeVisible();

    await page.evaluate(() => {
      window.confirm = (msg) => {
        console.log('MOCK CONFIRM:', msg);
        return true;
      };
      window.alert = (msg) => {
        console.log('MOCK ALERT:', msg);
      };
    });
    await syncBtn.click();
    await page.waitForTimeout(1000);

    // Verify newly synced file shows in the vault explorer tree
    await expect(fileTree.locator('.tree-node:has-text("Virtual To Sync.md")')).toBeVisible();
    await expect(syncBtn).not.toBeVisible();
  });
});
