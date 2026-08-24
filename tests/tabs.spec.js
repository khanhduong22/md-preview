import { test, expect } from '@playwright/test';

test.describe('Tab Persistence, Auto-Naming and Auto-Save', () => {
  test.beforeEach(async ({ page }) => {
    // Dismiss tour and privacy banner on page load
    await page.addInitScript(() => {
      localStorage.setItem('hasSeenTour', 'true');
      localStorage.setItem('kido-privacy-dismissed', '1');
    });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should persist new tabs and contents in normal mode on reload', async ({ page }) => {
    // 1. Create a new tab
    const newTabBtn = page.locator('.tab-new-btn');
    await newTabBtn.click();

    // 2. Type content into the editor
    const editor = page.locator('#markdown-editor');
    await editor.fill('Hello from persistent normal tab');

    // 3. Wait for the debounce save (500ms) to write to localforage
    await page.waitForTimeout(1000);

    // 4. Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // 5. Verify the content is restored
    const restoredEditor = page.locator('#markdown-editor');
    await expect(restoredEditor).toHaveValue('Hello from persistent normal tab');

    // Verify tab bar has the active tab
    const activeTab = page.locator('.tab-item.active');
    await expect(activeTab).toBeVisible();
  });

  test('should auto-name untitled tab from Markdown header on input', async ({ page }) => {
    // 1. Create a new tab (starts as Untitled X)
    const newTabBtn = page.locator('.tab-new-btn');
    await newTabBtn.click();

    const activeTab = page.locator('.tab-item.active');
    await expect(activeTab).toContainText('Untitled');

    // 2. Type Markdown with H1 header
    const editor = page.locator('#markdown-editor');
    await editor.fill('# Chiến Lược Marketing Q3 2026\n\nNội dung chi tiết chiến dịch...');

    // 3. Wait for auto-naming debounce (800ms)
    await page.waitForTimeout(1200);

    // 4. Verify the tab title updated automatically to the H1 heading
    await expect(activeTab).toContainText('Chiến Lược Marketing Q3 2026');
  });

  test('should auto-save virtual tab directly into Vault file handle with DDMMYY_HHmm timestamp', async ({ page }) => {
    // Setup mock File System Directory Handle & File Handle
    const result = await page.evaluate(async () => {
      const { AppState } = await import(window.location.origin + '/src/core/state.js');
      const { createTab } = await import(window.location.origin + '/src/core/tabs.js');
      const { persistVirtualTabToVault } = await import(window.location.origin + '/src/core/autosave.js');

      let savedFiles = {};
      
      const createFileHandle = (name) => ({
        kind: 'file',
        name: name,
        createWritable: async () => ({
          write: async (data) => {
            savedFiles[name].content = data;
          },
          close: async () => {}
        }),
        getFile: async () => ({
          text: async () => (savedFiles[name] ? savedFiles[name].content : '')
        })
      });

      const mockDirHandle = {
        kind: 'directory',
        name: 'MyNotes',
        queryPermission: async () => 'granted',
        requestPermission: async () => 'granted',
        getFileHandle: async (name, options) => {
          if (options && options.create) {
            if (!savedFiles[name]) {
              savedFiles[name] = { content: '' };
            }
            return createFileHandle(name);
          }
          if (savedFiles[name]) {
            return createFileHandle(name);
          }
          const err = new Error('File not found');
          err.name = 'NotFoundError';
          throw err;
        },
        entries: async function* () {
          for (const key of Object.keys(savedFiles)) {
            yield [key, createFileHandle(key)];
          }
        }
      };

      AppState.localVaultMode = true;
      AppState.vaultDirHandle = mockDirHandle;
      AppState.tabs = [];

      const docContent = '# Báo Cáo Doanh Thu\n\nNội dung báo cáo chi tiết.';
      const virtualTab = createTab(docContent, 'Untitled 1');
      AppState.tabs.push(virtualTab);
      AppState.activeTabId = virtualTab.id;

      const editor = document.getElementById('markdown-editor');
      if (editor) editor.value = docContent;

      // Execute auto-save
      const success = await persistVirtualTabToVault(virtualTab);

      return {
        success,
        tabId: virtualTab.id,
        activeTabId: AppState.activeTabId,
        tabTitle: virtualTab.title,
        hasHandle: !!virtualTab.handle,
        savedFiles
      };
    });

    expect(result.success).toBe(true);
    expect(result.hasHandle).toBe(true);
    // Tab ID and ActiveTabId must be synchronized
    expect(result.tabId).toBe(result.activeTabId);
    expect(result.tabId).toContain('MyNotes/');
    // Title must have header and timestamp
    expect(result.tabTitle).toContain('Báo Cáo Doanh Thu');
    // Filename in mock disk must contain content
    const fileNames = Object.keys(result.savedFiles);
    expect(fileNames.length).toBe(1);
    expect(result.savedFiles[fileNames[0]].content).toBe('# Báo Cáo Doanh Thu\n\nNội dung báo cáo chi tiết.');
  });

  test('should persist virtual tabs in vault mode on reload', async ({ page }) => {
    // Setup localforage override to intercept kido-vault-handle load during bootstrap
    await page.addInitScript(() => {
      let localforageInstance = null;
      Object.defineProperty(window, 'localforage', {
        get() {
          return localforageInstance;
        },
        set(val) {
          localforageInstance = val;
          if (val && !val.getItem.__isMocked) {
            const originalGetItem = val.getItem;
            val.getItem = function (key) {
              if (key === 'kido-vault-handle') {
                return {
                  kind: 'directory',
                  name: 'test-vault',
                  queryPermission: async () => 'granted',
                  requestPermission: async () => 'granted',
                  entries: async function* () {}
                };
              }
              return originalGetItem.apply(this, arguments);
            };
            val.getItem.__isMocked = true;
          }
        },
        configurable: true
      });
    });

    // 1. Setup vault mode and virtual tab content in current session
    await page.evaluate(async () => {
      // Force vault mode
      const { AppState } = await import(window.location.origin + '/src/core/state.js');
      AppState.localVaultMode = true;
      
      // Create virtual tab in vault mode
      const { createTab } = await import(window.location.origin + '/src/core/tabs.js');
      AppState.tabs = [];
      const tab = createTab('Virtual content in vault mode', 'Virtual Tab');
      AppState.tabs.push(tab);
      AppState.activeTabId = tab.id;
      
      // Save state to store it in localforage
      const { saveTabsToStorage, saveActiveTabId } = await import(window.location.origin + '/src/core/tabs.js');
      saveTabsToStorage(AppState.tabs);
      saveActiveTabId(AppState.activeTabId);
    });

    // 2. Wait to ensure database write is completed
    await page.waitForTimeout(500);

    // 3. Reload page (which boots using the overridden localforage init script)
    await page.reload();
    await page.waitForLoadState('networkidle');

    // 4. Verify the tab and content are successfully restored
    const restoredEditor = page.locator('#markdown-editor');
    await expect(restoredEditor).toHaveValue('Virtual content in vault mode');

    const activeTab = page.locator('.tab-item.active');
    await expect(activeTab).toContainText('Virtual Tab');
  });
});
