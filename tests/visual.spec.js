import { test, expect } from '@playwright/test';
import fs from 'fs';

test.describe('Visual Regression Testing', () => {
  test('trang chủ lúc mới vào (Light Mode)', async ({ page }) => {
    // 1. Mở trang web (Playwright sẽ tự bật dev server ở cổng 5173)
    await page.goto('/');

    // 2. Chờ một tí cho các hiệu ứng, font chữ tải xong hoàn toàn
    await page.waitForLoadState('networkidle');
    
    // Tắt cái banner "Got it" bằng JS thuần để khỏi dính lỗi scroll/viewport
    await page.evaluate(() => {
      const banner = document.getElementById('privacy-notice');
      if (banner) banner.style.display = 'none';
    });

    // 3. Chụp màn hình và so sánh! (Lần đầu chạy nó sẽ tự tạo file mẫu)
    // - maxDiffPixels: cho phép lệch tối đa 100 pixel
    await expect(page).toHaveScreenshot('homepage-light-mode.png', {
      maxDiffPixels: 100,
      animations: 'disabled' // Đóng băng mọi animation để ảnh nhất quán
    });

    // Đính kèm ảnh gốc (Baseline) vào Report để xem bằng tay
    const snapshotPath = test.info().snapshotPath('homepage-light-mode.png');
    if (fs.existsSync(snapshotPath)) {
      await test.info().attach('Baseline Image', { path: snapshotPath, contentType: 'image/png' });
    }
  });

  test('trang chủ lúc bật Dark Mode', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Tắt banner bằng JS thuần
    await page.evaluate(() => {
      const banner = document.getElementById('privacy-notice');
      if (banner) banner.style.display = 'none';
    });

    // Click nút Dark Mode (dùng JS thuần để đổi luôn data-theme cho chắc)
    await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));

    // Đợi 1 tí cho hiệu ứng chuyển màu xong (transition của CSS)
    await page.waitForTimeout(1000);

    // Chụp lại và lưu với tên khác
    await expect(page).toHaveScreenshot('homepage-dark-mode.png', {
      maxDiffPixels: 100,
      animations: 'disabled'
    });

    // Đính kèm ảnh gốc (Baseline) vào Report
    const snapshotPath = test.info().snapshotPath('homepage-dark-mode.png');
    if (fs.existsSync(snapshotPath)) {
      await test.info().attach('Baseline Image', { path: snapshotPath, contentType: 'image/png' });
    }
  });
});
