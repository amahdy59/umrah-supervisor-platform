import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Umrah Platform E2E & Accessibility Smoke', () => {
  test('Pilgrim Companion renders cleanly, navigates atlas/compass, and passes WCAG 2 AA axe audit', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));

    await page.goto('/');
    await expect(page.locator('#badge-pilgrim-name')).toBeVisible();

    // Check WebP image loading in Haram Atlas
    await page.click('[data-tab-target="haram-atlas"]');
    await expect(page.locator('#haram-atlas-cards article').first()).toBeVisible();

    const firstImg = page.locator('#haram-atlas-cards img').first();
    await firstImg.scrollIntoViewIfNeeded();
    await expect(firstImg).toHaveJSProperty('complete', true);
    const naturalW = await firstImg.evaluate((el: HTMLImageElement) => el.naturalWidth);
    expect(naturalW).toBeGreaterThan(0);

    // Check tap-to-zoom image lightbox
    await page.locator('#haram-atlas-cards button.img-zoom-btn').first().click();
    await expect(page.locator('#image-lightbox-modal')).toBeVisible();
    await page.locator('#image-lightbox-modal [data-close-lightbox]').click();
    await expect(page.locator('#image-lightbox-modal')).toBeHidden();

    // Verify single top-level H1 landmark
    await expect(page.locator('h1')).toHaveCount(1);

    // Check Personal Installments modal
    await page.click('[data-tab-target="rituals"]');
    await page.click('#btn-my-installments');
    await expect(page.locator('#my-installments-modal')).toBeVisible();
    await page.click('[data-close-dialog="my-installments-modal"]');

    // Check AR/EN toggle
    await page.click('.header-tools [data-lang-toggle]');
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
    await page.click('.header-tools [data-lang-toggle]');
    await expect(page.locator('html')).toHaveAttribute('lang', 'ar');

    // Check Axe WCAG accessibility scan
    const axeResults = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    expect(axeResults.violations).toEqual([]);
    expect(errors).toEqual([]);
  });

  test('Supervisor Mission Control renders cleanly with progressive form disclosure & PIN lock modal', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));

    await page.goto('/supervisor.html');
    await expect(page.locator('#active-group-switcher')).toBeVisible();

    // Progressive disclosure in installments form
    await page.click('.top-primary-nav [data-tab-target="gameya"]');
    await page.selectOption('#new-gam-plan', 'FULL_CASH');
    await expect(page.locator('#gam-down-wrap')).toBeHidden();
    await expect(page.locator('#gam-count-wrap')).toBeHidden();

    await page.selectOption('#new-gam-plan', 'ROTATING_ROSCA');
    await expect(page.locator('#gam-turn-wrap')).toBeVisible();

    const axeResults = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    expect(axeResults.violations).toEqual([]);
    expect(errors).toEqual([]);
  });
});
