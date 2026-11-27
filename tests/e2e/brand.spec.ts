import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.describe('Sheikh Mostafa Flefel & Abshirou Branding E2E', () => {
  test('renders upgraded spotlight, direct WhatsApp studio, zero-women curated gallery, EN toggle, and WCAG AA', async ({
    page,
  }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    await page.goto('/');

    // Spotlight banner appears with direct WhatsApp + curated avatar image + Granada license 1094
    const spotlight = page.locator('#pilgrim-brand-spotlight');
    await expect(spotlight).toBeVisible();
    await expect(spotlight).toContainText('الشيخ مصطفى فليفل');
    await expect(spotlight).toContainText('1094');
    await expect(spotlight.locator('img')).toHaveAttribute(
      'src',
      '/images/brand/sheikh-mostafa-avatar.jpg'
    );
    await expect(page.locator('#wa-supervisor-link')).toHaveAttribute('href', /wa\.me\/201040414659/);
    await expect(page.locator('#app-brand-footer')).toContainText('01040414659');

    const spotlightImgOk = await spotlight
      .locator('img')
      .evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0);
    expect(spotlightImgOk).toBe(true);

    // Navigate via spotlight button to dedicated Abshirou Hub tab
    await spotlight.locator('[data-open-brand-hub]').click();
    const abshirouTab = page.locator('#tab-abshirou');
    await expect(abshirouTab).toBeVisible();

    // Verify Interactive Direct WhatsApp Message Studio updates textarea by intent
    const fiqhPresetBtn = abshirouTab.locator('[data-wa-intent="fiqh"]');
    await fiqhPresetBtn.click();
    await expect(fiqhPresetBtn).toHaveAttribute('aria-pressed', 'true');
    const waComposerInput = abshirouTab.locator('#brand-wa-message');
    await expect(waComposerInput).toHaveValue(/سؤال شرعي/);

    // Ensure all 5 curated images (1 hero + 4 gallery) load cleanly and NO excluded images exist
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

    const html = await abshirouTab.innerHTML();
    expect(html).toContain('sheikh-kaaba-dua.jpg');
    expect(html).toContain('sheikh-nabawi-rawdah.jpg');
    expect(html).toContain('kaaba-door.webp');
    expect(html).toContain('nabawi-umbrellas.webp');
    expect(html).not.toContain('abshirou-fb-cover');
    expect(html).not.toContain('abshirou-yt-avatar');
    expect(html).not.toContain('mustafa_flyfl');
    expect(html).not.toContain('mostafafelefl33');

    // Gallery tap-to-zoom lightbox opens cleanly and closes
    await abshirouTab.locator('.brand-gallery-portraits [data-zoom-src]').first().click();
    const lightbox = page.locator('#image-lightbox-modal');
    await expect(lightbox).toBeVisible();
    await lightbox.locator('[data-close-lightbox]').click();
    await expect(lightbox).toBeHidden();

    // WCAG 2.1 AA audit in light mode
    const lightAxe = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    expect(lightAxe.violations).toEqual([]);

    // Dark Mode toggle + settled CSS transition check
    await page.locator('.desktop-only-tools[data-theme-toggle]').click();
    await expect(page.locator('meta[name="color-scheme"]')).toHaveAttribute('content', 'dark');
    await page.waitForTimeout(450);
    const darkAxe = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    expect(darkAxe.violations).toEqual([]);

    // Switch back light + English LTR and verify consistent translation across header & brand tab
    await page.locator('.desktop-only-tools[data-theme-toggle]').click();
    await page.locator('.desktop-only-tools[data-lang-toggle]').click();
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
    await expect(page.locator('#header-trip-subtitle')).toContainText('Shaaban Blessed Umrah Group');
    await expect(abshirouTab).toContainText('Sheikh Mostafa Flefel (Abu Radwa)');
    await expect(abshirouTab).toContainText('Granada Tourism Co. — License #1094');
    await expect(page.locator('#app-brand-footer')).toContainText('WhatsApp Sheikh (01040414659)');

    expect(pageErrors).toEqual([]);
  });

  test('displays Abshirou brand hub & footer cleanly on mobile 390x844 with zero overflow', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');

    await page.locator('#pilgrim-brand-spotlight [data-open-brand-hub]').click();
    await expect(page.locator('#tab-abshirou')).toBeVisible();
    await expect(page.locator('#app-brand-footer')).toBeVisible();

    const overflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    expect(overflow).toBe(false);
  });

  test('integrates Abshirou direct comms, channels, and footer in Supervisor Mission Control', async ({
    page,
  }) => {
    await page.goto('/supervisor');
    await expect(page.locator('header h1')).toContainText('الشيخ مصطفى فليفل');
    await expect(page.locator('#app-brand-footer')).toContainText('01040414659');

    await page.locator('.top-primary-nav [data-tab-target="whatsapp"]').click();
    const waPanel = page.locator('#whatsapp-posts-container');
    await expect(waPanel).toContainText('التواصل المباشر وقنوات الشيخ مصطفى فليفل');
    await expect(waPanel.locator('a[href*="wa.me/201040414659"]')).toBeVisible();

    const axe = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    expect(axe.violations).toEqual([]);
  });
});
