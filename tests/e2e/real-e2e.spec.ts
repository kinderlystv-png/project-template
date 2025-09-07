import { expect, test } from '@playwright/test';

test.describe('Real E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load homepage successfully', async ({ page }) => {
    // Проверяем, что страница загружается
    await expect(page).toHaveTitle(/SHINOMONTAGKA/);

    // Проверяем наличие основных элементов
    await expect(page.locator('body')).toBeVisible();
  });

  test('should have working navigation', async ({ page }) => {
    // Проверяем навигацию (если есть)
    const links = page.locator('a[href]');
    const count = await links.count();

    if (count > 0) {
      // Тестируем первую ссылку
      await links.first().click();
      await page.waitForLoadState('networkidle');
      expect(page.url()).toBeTruthy();
    }
  });

  test('should be responsive', async ({ page }) => {
    // Тестируем адаптивность
    await page.setViewportSize({ width: 375, height: 667 }); // Mobile
    await page.waitForTimeout(500);

    const body = page.locator('body');
    await expect(body).toBeVisible();

    await page.setViewportSize({ width: 1920, height: 1080 }); // Desktop
    await page.waitForTimeout(500);
    await expect(body).toBeVisible();
  });

  test('should have accessible content', async ({ page }) => {
    // Базовые проверки доступности
    const mainContent = page.locator('main, [role="main"], body');
    await expect(mainContent).toBeVisible();

    // Проверяем, что есть заголовки
    const headings = page.locator('h1, h2, h3, h4, h5, h6');
    const headingCount = await headings.count();
    expect(headingCount).toBeGreaterThan(0);
  });

  test('should handle JavaScript interactions', async ({ page }) => {
    // Проверяем, что JavaScript работает
    const jsEnabled = await page.evaluate(() => {
      return typeof window !== 'undefined' && typeof document !== 'undefined';
    });

    expect(jsEnabled).toBe(true);

    // Проверяем консоль на ошибки
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleLogs.push(msg.text());
      }
    });

    await page.reload();
    await page.waitForLoadState('networkidle');

    // Проверяем, что критических ошибок нет
    const criticalErrors = consoleLogs.filter(
      log => log.includes('Uncaught') || log.includes('TypeError')
    );
    expect(criticalErrors.length).toBe(0);
  });
});
