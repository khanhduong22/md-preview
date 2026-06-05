import { test, expect } from '@playwright/test';

test.describe('Tab Persistence and Auto-Save', () => {
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

    // Verify tab bar has the newly created tab active
    const activeTab = page.locator('.tab-item.active');
    await expect(activeTab).toContainText('Untitled 1');
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
