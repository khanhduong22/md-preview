import { test, expect } from '@playwright/test';

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
    // - maxDiffPixels: cho phép lệch tối đa 100 pixel (do render khác nhau trên các máy)
    // - mask: Che lại thanh cuộn (nếu có) để khỏi bị báo lỗi xàm
    await expect(page).toHaveScreenshot('homepage-light-mode.png', {
      maxDiffPixels: 100,
      fullPage: true, // Chụp toàn bộ trang, từ trên xuống dưới
      animations: 'disabled' // Đóng băng mọi animation để ảnh nhất quán
    });
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
      fullPage: true,
      animations: 'disabled'
    });
  });
});
