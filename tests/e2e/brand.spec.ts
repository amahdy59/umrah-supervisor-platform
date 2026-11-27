import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.describe('Sheikh Mostafa Flefel & Abshirou Branding E2E', () => {
  test('renders brand spotlight, Abshirou tab, gallery zoom, EN toggle, and passes WCAG AA in light & dark modes', async ({
    page,
  }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    await page.goto('/');

    // Spotlight banner appears on default Rituals tab with avatar image loaded
    const spotlight = page.locator('#pilgrim-brand-spotlight');
    await expect(spotlight).toBeVisible();
    await expect(spotlight).toContainText('الشيخ مصطفى فليفل');
    await expect(spotlight).toContainText('1094');

    const spotlightImgOk = await spotlight.locator('img').evaluate((img: HTMLImageElement) => {
      return img.complete && img.naturalWidth > 0;
    });
    expect(spotlightImgOk).toBe(true);

    // Navigate via spotlight button to dedicated Abshirou Hub tab
    await spotlight.locator('[data-open-brand-hub]').click();
    const abshirouTab = page.locator('#tab-abshirou');
    await expect(abshirouTab).toBeVisible();

    // Ensure all 5 brand images (1 spotlight + 4 gallery/hero) load cleanly with naturalWidth > 0
    const hubImages = abshirouTab.locator('img');
    const imgCount = await hubImages.count();
    expect(imgCount).toBe(5);
    for (let i = 0; i < imgCount; i++) {
      await hubImages.nth(i).scrollIntoViewIfNeeded();
      await expect
        .poll(() =>
          hubImages.nth(i).evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)
        )
        .toBe(true);
    }

    // Verified official social links are present and dead handles are absent
    const html = await abshirouTab.innerHTML();
    expect(html).toContain('100064043891945');
    expect(html).toContain('mstfy.flyfl');
    expect(html).toContain('https://www.youtube.com/@apopara14');
    expect(html).toContain('https://www.instagram.com/apshro14/');
    expect(html).toContain('https://chat.whatsapp.com/JKJgvqRVRAD0mJ4ThjkLVh');
    expect(html).not.toContain('mustafa_flyfl');
    expect(html).not.toContain('mostafafelefl33');

    // Gallery tap-to-zoom lightbox opens cleanly and closes via Escape/button
    const firstZoomBtn = abshirouTab.locator('.brand-gallery-grid [data-zoom-src]').first();
    await firstZoomBtn.click();
    const lightbox = page.locator('#image-lightbox-modal');
    await expect(lightbox).toBeVisible();
    await lightbox.locator('[data-close-lightbox]').click();
    await expect(lightbox).toBeHidden();

    // WCAG 2.1 AA audit in light mode on #tab-abshirou
    const lightAxe = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    expect(lightAxe.violations).toEqual([]);

    // Switch to dark mode and run WCAG 2.1 AA audit again (wait for CSS color transition to settle)
    await page.locator('.desktop-only-tools[data-theme-toggle]').click();
    await expect(page.locator('meta[name="color-scheme"]')).toHaveAttribute('content', 'dark');
    await page.waitForTimeout(450);
    const darkAxe = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    expect(darkAxe.violations).toEqual([]);

    // Switch to English and verify full brand translation & LTR direction
    await page.locator('.desktop-only-tools[data-lang-toggle]').click();
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
    await expect(abshirouTab).toContainText('Sheikh Mostafa Flefel (Abu Radwa)');
    await expect(abshirouTab).toContainText('Granada Tourism Co. — License #1094');

    expect(pageErrors).toEqual([]);
  });

  test('displays Abshirou brand hub cleanly on mobile 390x844 with zero horizontal overflow', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');

    await page.locator('#pilgrim-brand-spotlight [data-open-brand-hub]').click();
    await expect(page.locator('#tab-abshirou')).toBeVisible();

    const overflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    expect(overflow).toBe(false);
  });

  test('integrates Abshirou & Granada #1094 marketing broadcasts in Supervisor Mission Control', async ({
    page,
  }) => {
    await page.goto('/supervisor');
    await expect(page.locator('header h1')).toContainText('الشيخ مصطفى فليفل');

    // Open WhatsApp Comms tab inside Supervisor Portal
    await page.locator('.top-primary-nav [data-tab-target="whatsapp"]').click();
    const waPanel = page.locator('#whatsapp-posts-container');
    await expect(waPanel).toContainText('أبشروا');
    await expect(waPanel).toContainText('1094');
    await expect(waPanel).toContainText('01040414659');

    const axe = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    expect(axe.violations).toEqual([]);
  });
});
