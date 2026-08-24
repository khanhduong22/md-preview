import { test, expect } from '@playwright/test';

test.describe('Auto-Naming & Sanitization Utilities', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('hasSeenTour', 'true');
      localStorage.setItem('kido-privacy-dismissed', '1');
    });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should correctly format date timestamps as DDMMYY_HHmm', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const { formatDateTimestamp } = await import(window.location.origin + '/src/utils/autoname.js');
      const testDate = new Date(2026, 7, 24, 11, 20); // 24 Aug 2026 11:20
      return formatDateTimestamp(testDate);
    });
    expect(result).toBe('240826_1120');
  });

  test('should sanitize file names safely across OSes', async ({ page }) => {
    const results = await page.evaluate(async () => {
      const { sanitizeFileName } = await import(window.location.origin + '/src/utils/autoname.js');
      return {
        illegalChars: sanitizeFileName('Báo cáo / Tài chính: Quý 3 * 2026 ?'),
        quotes: sanitizeFileName('"Kế hoạch kinh doanh <VIP>"'),
        whitespace: sanitizeFileName('   Document   with    spaces   '),
        empty: sanitizeFileName(''),
      };
    });

    expect(results.illegalChars).toBe('Báo cáo - Tài chính- Quý 3 - 2026');
    expect(results.quotes).toBe('Kế hoạch kinh doanh -VIP');
    expect(results.whitespace).toBe('Document with spaces');
    expect(results.empty).toBe('Untitled');
  });

  test('should extract title from H1, H2, frontmatter, or first sentence', async ({ page }) => {
    const results = await page.evaluate(async () => {
      const { extractMarkdownTitle } = await import(window.location.origin + '/src/utils/autoname.js');

      const h1Sample = '# Báo Cáo Doanh Thu Tháng 8\n\nNội dung chi tiết ở đây.';
      const h2Sample = '## Mục Tiêu Phát Triển Sprint 12\n\nDanh sách task.';
      const frontmatterSample = '---\ntitle: "Chiến Lược Marketing 2026"\nauthor: Kido\n---\n# Header bỏ qua';
      const rawTextSample = 'Đây là một đoạn ghi chú nhanh không có tiêu đề markdown.\nNội dung tiếp theo.';
      const boldSample = '**Dự án Antigravity IDE**\nChi tiết kiến trúc.';

      return {
        h1: extractMarkdownTitle(h1Sample),
        h2: extractMarkdownTitle(h2Sample),
        frontmatter: extractMarkdownTitle(frontmatterSample),
        rawText: extractMarkdownTitle(rawTextSample),
        bold: extractMarkdownTitle(boldSample)
      };
    });

    expect(results.h1).toBe('Báo Cáo Doanh Thu Tháng 8');
    expect(results.h2).toBe('Mục Tiêu Phát Triển Sprint 12');
    expect(results.frontmatter).toBe('Chiến Lược Marketing 2026');
    expect(results.rawText).toContain('Đây là một đoạn ghi chú nhanh');
    expect(results.bold).toBe('Dự án Antigravity IDE');
  });

  test('should identify untitled tabs properly', async ({ page }) => {
    const results = await page.evaluate(async () => {
      const { isUntitledTab } = await import(window.location.origin + '/src/utils/autoname.js');
      return {
        untitled: isUntitledTab('Untitled'),
        untitled1: isUntitledTab('Untitled 1'),
        untitled99: isUntitledTab('Untitled 99'),
        customTitle: isUntitledTab('Báo cáo Q3'),
        empty: isUntitledTab('')
      };
    });

    expect(results.untitled).toBe(true);
    expect(results.untitled1).toBe(true);
    expect(results.untitled99).toBe(true);
    expect(results.customTitle).toBe(false);
    expect(results.empty).toBe(true);
  });
});
