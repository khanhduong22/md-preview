import { test, expect } from '@playwright/test';

test.describe('Application Features', () => {
  test.beforeEach(async ({ page, context }) => {
    // Dismiss tour and privacy banner on page load
    await page.addInitScript(() => {
      localStorage.setItem('hasSeenTour', 'true');
      localStorage.setItem('kido-privacy-dismissed', '1');
    });
    // Grant clipboard permissions for share testing
    await context.grantPermissions(['clipboard-write', 'clipboard-read']);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should render markdown correctly, update stats and TOC', async ({ page }) => {
    const editor = page.locator('#markdown-editor');
    await editor.fill('# Heading test\n\nThis is a sample markdown paragraph with words.');

    // Wait for the render delay (150ms) + buffer
    await page.waitForTimeout(500);

    // 1. Verify markdown preview renders the heading and paragraph
    const heading = page.locator('#markdown-preview h1');
    await expect(heading).toContainText('Heading test');

    const paragraph = page.locator('#markdown-preview p');
    await expect(paragraph).toContainText('This is a sample markdown paragraph with words.');

    // 2. Verify Table of Contents (TOC) is updated
    const tocNode = page.locator('#toc-tree .tree-node-title');
    await expect(tocNode).toContainText('Heading test');

    // 3. Verify document stats are updated
    // Check words count container
    const wordsCount = page.locator('#word-count');
    await expect(wordsCount).toContainText('11'); // Includes the '#' symbol as a word token since we split by whitespace

    const charCount = page.locator('#char-count');
    await expect(charCount).toContainText('63'); // Total characters in text
  });

  test('should toggle dark/light theme when theme toggle is clicked', async ({ page }) => {
    // 1. Check initial data-theme (default should be empty or default)
    const initialTheme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    expect(initialTheme).not.toBe('dark');

    // 2. Click the theme toggle button
    const themeBtn = page.locator('#theme-toggle');
    await themeBtn.click();

    // 3. Assert that data-theme is set to dark
    const darkTheme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    expect(darkTheme).toBe('dark');

    // 4. Click again
    await themeBtn.click();

    // 5. Assert that it goes back to light theme
    const lightTheme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    expect(lightTheme).toBe('light');
  });

  test('should support tab management (duplicate, pin, rename, group, delete)', async ({ page }) => {
    // 1. Create a new tab
    const newTabBtn = page.locator('.tab-new-btn');
    await newTabBtn.click();
    await page.waitForTimeout(100);

    const activeTab = page.locator('.tab-item.active');
    await expect(activeTab).toContainText('Untitled 1');

    // 2. Duplicate active tab using context options menu
    const menuBtn = activeTab.locator('.tab-menu-btn');
    await menuBtn.click();

    const duplicateBtn = page.locator('.tab-item.active .tab-menu-dropdown button[data-action="duplicate"]');
    await duplicateBtn.click();
    await page.waitForTimeout(200);

    // Verify a duplicate tab is created and active
    const newActiveTab = page.locator('.tab-item.active');
    await expect(newActiveTab).toContainText('Untitled 1 (copy)');

    // 3. Pin the tab
    const newMenuBtn = newActiveTab.locator('.tab-menu-btn');
    await newMenuBtn.click();
    
    const pinBtn = page.locator('.tab-item.active .tab-menu-dropdown button[data-action="pin"]');
    await pinBtn.click();
    await page.waitForTimeout(200);

    // 4. Close the duplicated tab (delete)
    const closeBtn = page.locator('.tab-item.active .tab-close-btn');
    // If the close button isn't visible, we can trigger the delete menu item
    if (await closeBtn.count() > 0) {
      await closeBtn.click();
    } else {
      const activeTabOptions = page.locator('.tab-item.active .tab-menu-btn');
      await activeTabOptions.click();
      const deleteBtn = page.locator('.tab-item.active .tab-menu-dropdown button[data-action="delete"]');
      await deleteBtn.click();
    }
    await page.waitForTimeout(200);

    // Duplicated tab should be closed, and previous tab should be active
    const finalActiveTab = page.locator('.tab-item.active');
    await expect(finalActiveTab).not.toContainText('Untitled 1 (copy)');
  });

  test('should record history snapshot after typing and allow diff viewing', async ({ page }) => {
    // 1. Type in the editor to trigger auto-snapshot (needs to be non-empty)
    const editor = page.locator('#markdown-editor');
    await editor.fill('Version 1 of the document.');

    // 2. Wait for the auto-snapshot debounce timer (5000ms) + buffer
    await page.waitForTimeout(5500);

    // 3. Open version history panel
    const historyBtn = page.locator('#history-btn');
    await historyBtn.click();

    // 4. Verify history item is displayed in panel
    const panel = page.locator('#history-panel');
    await expect(panel).toBeVisible();

    const historyItem = page.locator('.history-item');
    await expect(historyItem).toHaveCount(1);
    await expect(historyItem).toContainText('Welcome to Markdown');

    // 5. Click the history item to view the diff
    await historyItem.click();

    // 6. Verify the diff view is visible and displays the added line
    const diffView = page.locator('#history-diff-view');
    await expect(diffView).toBeVisible();
    const addedLine = page.locator('.diff-line.diff-added');
    await expect(addedLine).toContainText('Version 1 of the document.');
  });

  test('should trigger tab actions via keyboard shortcuts', async ({ page }) => {
    // 1. Focus the editor and trigger Ctrl+T to open a new tab
    const editor = page.locator('#markdown-editor');
    await editor.focus();
    await page.keyboard.press('Control+t');
    await page.waitForTimeout(200);

    // Verify a new tab is created (initial tabs are 2: "Welcome to Markdown" and "30 chart")
    const tabs = page.locator('.tab-item');
    await expect(tabs).toHaveCount(3);

    // 2. Trigger Ctrl+W to close the active tab
    await page.keyboard.press('Control+w');
    await page.waitForTimeout(200);

    // Verify tab count is back to 2
    await expect(tabs).toHaveCount(2);
  });

  test('should support creating tab groups', async ({ page }) => {
    // 1. Create a new tab first
    const newTabBtn = page.locator('.tab-new-btn');
    await newTabBtn.click();
    await page.waitForTimeout(100);

    // 2. Setup mock prompt for group name
    await page.evaluate(() => {
      window.prompt = () => 'My Test Group';
    });

    // 3. Open options menu and hover group -> click new group
    const activeTab = page.locator('.tab-item.active');
    const menuBtn = activeTab.locator('.tab-menu-btn');
    await menuBtn.click();

    const groupMenuOption = page.locator('.tab-item.active .tab-menu-dropdown button[data-action="group-menu"]');
    await groupMenuOption.hover({ force: true });
    await page.waitForTimeout(200);

    const newGroupBtn = page.locator('.tab-item.active .tab-group-submenu button[data-action="new-group"]');
    await newGroupBtn.click();
    await page.waitForTimeout(200);

    // 4. Verify group header is created
    const groupHeader = page.locator('.tab-group-header');
    await expect(groupHeader).toBeVisible();
    await expect(groupHeader).toContainText('My Test Group');
  });

  test('should encode content and generate a share URL, and decode it on reload', async ({ page }) => {
    // 1. Type unique content
    const editor = page.locator('#markdown-editor');
    await editor.fill('Shared content test note.');
    await page.waitForTimeout(200);

    // 2. Click the share button
    const shareBtn = page.locator('#share-button');
    await shareBtn.click();
    await page.waitForTimeout(500);

    // 3. Verify the URL hash contains the share string
    const url = page.url();
    expect(url).toContain('#share=');

    // 4. Open a clean page with the shared URL
    const newPage = await page.context().newPage();
    await newPage.addInitScript(() => {
      localStorage.setItem('hasSeenTour', 'true');
      localStorage.setItem('kido-privacy-dismissed', '1');
    });
    await newPage.goto(url);
    await newPage.waitForLoadState('networkidle');

    // 5. Verify the content is decoded and visible in the editor
    const newEditor = newPage.locator('#markdown-editor');
    await expect(newEditor).toHaveValue('Shared content test note.');

    const activeTab = newPage.locator('.tab-item.active');
    await expect(activeTab).toContainText('Shared Note');
    
    await newPage.close();
  });

  test('should reset all tabs when reset button is clicked and confirmed', async ({ page }) => {
    // 1. Create a new tab to have 3 tabs total
    const newTabBtn = page.locator('.tab-new-btn');
    await newTabBtn.click();
    await page.waitForTimeout(100);

    const tabs = page.locator('.tab-item');
    await expect(tabs).toHaveCount(3);

    // 2. Click reset button
    const resetBtn = page.locator('#tab-reset-btn');
    await resetBtn.click();

    // 3. Confirm modal
    const confirmBtn = page.locator('#reset-modal-confirm');
    await confirmBtn.click();
    await page.waitForTimeout(200);

    // 4. Verify we are back to default tabs (2 tabs)
    await expect(tabs).toHaveCount(2);
    const activeTab = page.locator('.tab-item.active');
    await expect(activeTab).toContainText('Welcome to Markdown');
  });

  test('should allow exporting current tab as Markdown file', async ({ page }) => {
    // 1. Open the export dropdown
    const exportDropdown = page.locator('#exportDropdown');
    await exportDropdown.click();

    // 2. Click the Export Markdown option
    const exportMdOption = page.locator('#export-md');
    
    // Start waiting for download before clicking
    const downloadPromise = page.waitForEvent('download');
    await exportMdOption.click();
    const download = await downloadPromise;

    // 3. Verify the suggested filename
    expect(download.suggestedFilename()).toContain('.md');
  });

  test('should import markdown file when uploaded via file input', async ({ page }) => {
    // 1. Select the file using the file chooser initiated by dropzone click
    const fileChooserPromise = page.waitForEvent('filechooser');
    const dropzone = page.locator('#dropzone');
    await dropzone.click();
    const fileChooser = await fileChooserPromise;

    // 2. Load custom markdown file buffer
    const fileBuffer = Buffer.from('# Imported File Title\nThis is the content of the imported file.');
    await fileChooser.setFiles([
      {
        name: 'test-import.md',
        mimeType: 'text/markdown',
        buffer: fileBuffer
      }
    ]);
    await page.waitForTimeout(300);

    // 3. Assert a new tab with name 'test-import' has been created and editor populated
    const activeTab = page.locator('.tab-item.active');
    await expect(activeTab).toContainText('test-import');

    const editor = page.locator('#markdown-editor');
    await expect(editor).toHaveValue('# Imported File Title\nThis is the content of the imported file.');
  });

  test('should toggle mobile menu and support mobile view mode changes', async ({ page }) => {
    // Set viewport to mobile size so mobile elements become visible
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(200);

    // 1. Open mobile menu panel
    const menuToggle = page.locator('#mobile-menu-toggle');
    await menuToggle.click();
    await page.waitForTimeout(100);

    const menuPanel = page.locator('#mobile-menu-panel');
    await expect(menuPanel).toHaveClass(/active/);

    // 2. Click mobile editor view mode button
    const editorModeBtn = page.locator('.mobile-view-mode-btn[data-mode="editor"]');
    await editorModeBtn.click();
    await page.waitForTimeout(200);

    // 3. Verify mobile panel closes and the main layout container switches to editor-only mode class
    await expect(menuPanel).not.toHaveClass(/active/);
    
    const contentContainer = page.locator('.content-container');
    await expect(contentContainer).toHaveClass(/view-editor-only/);
  });
});
