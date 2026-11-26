import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Desktop Light: Umrah Platform E2E & WCAG 2 AA', () => {
  test.use({ viewport: { width: 1280, height: 800 }, colorScheme: 'light' });

  test('Pilgrim Companion loads self-hosted fonts/audio, lightbox, focus mode, EN i18n, and passes Axe audit', async ({ page }) => {
    const errors: string[] = [];
    const externalFontRequests: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('request', (req) => {
      const url = req.url();
      if (url.includes('fonts.googleapis.com') || url.includes('fonts.gstatic.com')) {
        externalFontRequests.push(url);
      }
    });

    await page.goto('/');
    await expect(page.locator('#badge-pilgrim-name')).toBeVisible();
    await expect(page.locator('h1')).toHaveCount(1);

    // Zero external Google Fonts requests; local Cairo font + offline audio + sw v9 reachable
    expect(externalFontRequests).toEqual([]);
    const fontStatus = (await page.request.get('/fonts/cairo/cairo-arabic.woff2')).status();
    expect(fontStatus).toBe(200);
    const talbiyahStatus = (await page.request.get('/audio/talbiyah.mp3')).status();
    expect(talbiyahStatus).toBe(200);
    const chimeStatus = (await page.request.get('/audio/lap-chime.wav')).status();
    expect(chimeStatus).toBe(200);
    const ruknAudioStatus = (await page.request.get('/audio/rukn-yamani.mp3')).status();
    expect(ruknAudioStatus).toBe(200);
    const safaAudioStatus = (await page.request.get('/audio/safa-marwah.mp3')).status();
    expect(safaAudioStatus).toBe(200);
    const swText = await (await page.request.get('/sw.js')).text();
    expect(swText).toContain('umrah-companion-v14');

    // Prayer timer hero countdown + 6 individual prayer cards render live HH:MM:SS and progress
    await expect(page.locator('#prayer-hero-countdown')).toHaveText(/^\d{2,}:\d{2}:\d{2}$/);
    const prayerProgressVal = await page.locator('#prayer-hero-progress').evaluate((el) => (el as HTMLProgressElement).value);
    expect(prayerProgressVal).toBeGreaterThanOrEqual(0);
    expect(prayerProgressVal).toBeLessThanOrEqual(100);
    await expect(page.locator('.prayer-card')).toHaveCount(6);
    await expect(page.locator('.prayer-card.active')).toHaveCount(1);
    const firstCardTime = await page.locator('.prayer-card-time').first().textContent();
    expect(firstCardTime).toMatch(/^\d{2}:\d{2}$/);
    await page.click('#btn-city-madinah');
    await expect(page.locator('#prayer-city-title')).toContainText('المدينة');
    await page.click('#btn-city-makkah');

    // Tawaf Focus Ritual mode opens, advances lap, and syncs counter
    await page.click('#btn-focus-tawaf');
    await expect(page.locator('#focus-ritual-modal')).toBeVisible();
    await expect(page.locator('#focus-ritual-lap')).toContainText('1');
    await page.click('#btn-focus-advance');
    await expect(page.locator('#focus-ritual-lap')).toContainText('2');
    await page.click('[data-close-dialog="focus-ritual-modal"]');
    await expect(page.locator('#focus-ritual-modal')).toBeHidden();
    await expect(page.locator('#tawaf-lap-num')).toContainText('2');

    // Check WebP image loading & tap-to-zoom lightbox in Haram Atlas
    await page.click('[data-tab-target="haram-atlas"]');
    await expect(page.locator('#haram-atlas-cards article').first()).toBeVisible();
    const firstImg = page.locator('#haram-atlas-cards img').first();
    await firstImg.scrollIntoViewIfNeeded();
    await expect(firstImg).toHaveJSProperty('complete', true);
    expect(await firstImg.evaluate((el: HTMLImageElement) => el.naturalWidth)).toBeGreaterThan(0);

    await page.locator('#haram-atlas-cards button.img-zoom-btn').first().click();
    await expect(page.locator('#image-lightbox-modal')).toBeVisible();
    await page.locator('#image-lightbox-modal [data-close-lightbox]').click();
    await expect(page.locator('#image-lightbox-modal')).toBeHidden();

    // Personal Installments modal
    await page.click('[data-tab-target="rituals"]');
    await page.click('#btn-my-installments');
    await expect(page.locator('#my-installments-modal')).toBeVisible();
    await page.click('[data-close-dialog="my-installments-modal"]');

    // Complete AR -> EN -> AR switching including Atlas, Fiqh, Wallet (Packing & Taxi) cards
    await page.click('.header-tools [data-lang-toggle]');
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
    await page.click('[data-tab-target="haram-atlas"]');
    await expect(page.locator('#haram-atlas-cards')).toContainText('Door of the Kaaba');
    await page.click('[data-tab-target="wallet"]');
    await expect(page.locator('#pack-docs-list')).toContainText('Valid Passport');
    await expect(page.locator('#taxi-routes-list')).toContainText('Haramain Train Station');
    await page.click('[data-tab-target="fiqh"]');
    await expect(page.locator('#fiqh-rulings-list')).toContainText('Losing Wudu Mid-Tawaf');
    await page.click('.header-tools [data-lang-toggle]');
    await expect(page.locator('html')).toHaveAttribute('lang', 'ar');
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');

    // Return to main Rituals tab for full WCAG audit
    await page.click('[data-tab-target="rituals"]');
    const axeResults = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    expect(axeResults.violations).toEqual([]);
    expect(errors).toEqual([]);
  });

  test('Pilgrim shared-link profile overwrite guard protects custom saved data on Cancel and updates on Confirm', async ({ page }) => {
    await page.addInitScript(() => {
      if (!localStorage.getItem('umrah_test_seeded')) {
        localStorage.setItem(
          'umrah_pilgrim_profile_v2',
          JSON.stringify({
            fullName: 'محمود عبد الله المحفوظ',
            passportNumber: 'P99887766',
            tripCode: '#SAVED-1',
          })
        );
        localStorage.setItem('umrah_test_seeded', '1');
      }
    });

    await page.goto('/?name=IncomingGuest&passport=Z1111&payPlan=FULL_CASH&payTarget=50000');
    const guardModal = page.locator('#shared-link-overwrite-modal');
    await expect(guardModal).toBeVisible();
    await expect(guardModal).toContainText('IncomingGuest');

    const modalAxe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    expect(modalAxe.violations).toEqual([]);

    // Cancel keeps custom saved name intact
    await page.click('#overwrite-cancel-btn');
    await expect(guardModal).toBeHidden();
    await expect(page.locator('#badge-pilgrim-name')).toHaveText('محمود عبد الله المحفوظ');

    // Navigating with shared link again and confirming updates the saved profile
    await page.goto('/?name=ConfirmedPilgrim&passport=C2222&payPlan=FULL_CASH&payTarget=50000');
    await expect(guardModal).toBeVisible();
    await page.click('#overwrite-confirm-btn');
    await expect(guardModal).toBeHidden();
    await expect(page.locator('#badge-pilgrim-name')).toHaveText('ConfirmedPilgrim');
  });

  test('Supervisor Mission Control handles progressive disclosure, reset modal guard, and passes Axe audit', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));

    await page.goto('/supervisor.html');
    await expect(page.locator('#active-group-switcher')).toBeVisible();

    // Progressive disclosure, live preview, filters, & modals in enhanced Installments tab
    await page.click('.top-primary-nav [data-tab-target="gameya"]');
    await expect(page.locator('#gameya-summary-strip')).toBeVisible();
    await expect(page.locator('#gameya-plan-preview')).toContainText('مقدم');
    await page.selectOption('#new-gam-plan', 'FULL_CASH');
    await expect(page.locator('#gam-down-wrap')).toBeHidden();
    await expect(page.locator('#gam-count-wrap')).toBeHidden();
    await expect(page.locator('#gameya-plan-preview')).toContainText('دفعة واحدة كاملة');
    await page.selectOption('#new-gam-plan', 'ROTATING_ROSCA');
    await expect(page.locator('#gam-turn-wrap')).toBeVisible();

    // Filter pills & quick payment modal projection
    await page.click('[data-gameya-filter="OVERDUE"]');
    await expect(page.locator('[data-gameya-filter="OVERDUE"]')).toHaveAttribute('aria-pressed', 'true');
    await page.click('[data-gameya-filter="ALL"]');
    await page.locator('#gameya-tbody [data-open-pay]').first().click();
    await expect(page.locator('#payment-modal')).toBeVisible();
    await expect(page.locator('#pay-quick-presets .quick-preset-chip').first()).toBeVisible();
    await expect(page.locator('#pay-projection-preview')).toContainText('المتبقي');
    await page.click('#payment-modal [data-close-dialog="payment-modal"]');
    await expect(page.locator('#payment-modal')).toBeHidden();

    // Schedule modal ledger & edit disclosure
    await page.locator('#gameya-tbody [data-view-schedule]').first().click();
    await expect(page.locator('#schedule-modal')).toBeVisible();
    await expect(page.locator('#schedule-modal [data-copy-receipt]').first()).toBeVisible();
    await page.click('#schedule-modal [data-close-dialog="schedule-modal"] >> nth=0');
    await expect(page.locator('#schedule-modal')).toBeHidden();

    // Two-way Cloud Pull confirmation dialog against mocked /api/sync
    await page.route(/\/api\/sync(\?|$)/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          mode: 'd1',
          found: true,
          updatedAt: '2026-11-25T20:00:00.000Z',
          workspace: { settings: { tripTitle: 'Cloud Synced Group X', tripCode: '#CLD-X' } },
        }),
      });
    });
    await page.click('.top-primary-nav [data-tab-target="manifest"]');
    await page.click('#btn-pull-cloud-group');
    const pullModal = page.locator('#confirm-cloud-pull-modal');
    await expect(pullModal).toBeVisible();
    await expect(pullModal).toContainText('Cloud Synced Group X');
    await page.click('#btn-pull-confirm-yes');
    await expect(pullModal).toBeHidden();
    await expect(page.locator('#metric-trip-title')).toHaveText('Cloud Synced Group X');

    // Verify Proactive Attention Queue Strip & Consolidated Comms Hub (Broadcasts / Women / Haram Atlas)
    await expect(page.locator('#sup-attention-strip')).toBeVisible();
    await page.click('.top-primary-nav [data-tab-target="whatsapp"]');
    await expect(page.locator('#tab-whatsapp')).toBeVisible();
    await page.click('[data-comms-subtab="ATLAS"]');
    await expect(page.locator('#sup-comms-atlas-panel')).toBeVisible();
    await expect(page.locator('#sup-haram-atlas-cards')).toContainText('باب الملك');

    // Reset confirmation modal guard from popover (open via evaluate or trigger)
    await page.evaluate(() => {
      (document.querySelector('[data-reset-demo]') as HTMLElement | null)?.click();
    });
    const resetModal = page.locator('#confirm-reset-modal');
    await expect(resetModal).toBeVisible();
    const modalAxe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    expect(modalAxe.violations).toEqual([]);
    await page.click('#confirm-reset-modal [data-cancel-reset]');
    await expect(resetModal).toBeHidden();

    // Confirm restore default
    await page.evaluate(() => {
      (document.querySelector('[data-reset-demo]') as HTMLElement | null)?.click();
    });
    await expect(resetModal).toBeVisible();
    await page.click('#btn-confirm-reset-yes');
    await expect(resetModal).toBeHidden();

    const axeResults = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    expect(axeResults.violations).toEqual([]);
    expect(errors).toEqual([]);
  });
});

test.describe('Mobile Viewport (390x844): Navigation & WCAG 2 AA', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  test('Pilgrim mobile bottom bar, More popover, zero horizontal overflow, and Axe scan', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.mobile-bottom-nav')).toBeVisible();
    await expect(page.locator('.top-primary-nav')).toBeHidden();

    // Verify Situational Stage Priority Card, Quick Situation modal, & Unified Fiqh
    await expect(page.locator('#stage-priority-card')).toBeVisible();
    await page.click('#btn-quick-wudu');
    await expect(page.locator('#quick-ruling-modal')).toBeVisible();
    await expect(page.locator('#quick-ruling-body')).toContainText('الطواف');
    await page.click('#quick-ruling-modal [data-close-dialog="quick-ruling-modal"] >> nth=0');
    await expect(page.locator('#quick-ruling-modal')).toBeHidden();

    // Verify Unified Fiqh filters + Reference disclosure via mobile bottom nav
    await page.click('.mobile-bottom-nav [data-tab-target="fiqh"]');
    await expect(page.locator('#tab-fiqh')).toBeVisible();
    await page.click('[data-fiqh-filter="WOMEN"]');
    const firstWomenItem = page.locator('#fiqh-rulings-list .accordion-item.women-topic').first();
    await expect(firstWomenItem).toBeVisible();
    await firstWomenItem.locator('.accordion-header').click();
    await firstWomenItem.locator('.ref-disclosure summary').click();
    await expect(firstWomenItem.locator('.ref-disclosure')).toHaveAttribute('open', '');

    // Open mobile More popover for tools, then use mobile bottom bar directly for Haram Atlas
    await page.click('.more-trigger-mobile');
    await expect(page.locator('#pilgrim-more-popover')).toBeVisible();
    await expect(page.locator('#pilgrim-more-popover [data-senior-toggle]')).toBeVisible();
    await page.click('.more-trigger-mobile');
    await page.click('.mobile-bottom-nav [data-tab-target="haram-atlas"]');
    await expect(page.locator('#tab-haram-atlas')).toBeVisible();
    await expect(page.locator('#pilgrim-more-popover')).toBeHidden();

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 2
    );
    expect(overflow).toBe(false);

    const axeResults = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    expect(axeResults.violations).toEqual([]);
  });

  test('Supervisor mobile bottom nav, popover, and Axe WCAG scan pass', async ({ page }) => {
    await page.goto('/supervisor.html');
    await expect(page.locator('.mobile-bottom-nav')).toBeVisible();
    await expect(page.locator('.top-primary-nav')).toBeHidden();

    await page.click('.mobile-bottom-nav [data-tab-target="gameya"]');
    await expect(page.locator('#tab-gameya')).toBeVisible();

    const axeResults = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    expect(axeResults.violations).toEqual([]);
  });
});

test.describe('Dark Mode: WCAG 2 AA Contrast & Modal Audits', () => {
  test.use({ viewport: { width: 1280, height: 800 }, colorScheme: 'dark' });

  test('Pilgrim Companion in Dark Mode (rituals + focus modal) passes Axe WCAG 2 AA', async ({ page }) => {
    await page.goto('/');
    const baseAxe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    expect(baseAxe.violations).toEqual([]);

    await page.click('#btn-focus-tawaf');
    await expect(page.locator('#focus-ritual-modal')).toBeVisible();
    const modalAxe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    expect(modalAxe.violations).toEqual([]);
  });

  test('Supervisor Mission Control in Dark Mode (dashboard + reset modal) passes Axe WCAG 2 AA', async ({ page }) => {
    await page.goto('/supervisor.html');
    const baseAxe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    expect(baseAxe.violations).toEqual([]);

    await page.evaluate(() => {
      (document.querySelector('[data-reset-demo]') as HTMLElement | null)?.click();
    });
    await expect(page.locator('#confirm-reset-modal')).toBeVisible();
    const modalAxe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    expect(modalAxe.violations).toEqual([]);
  });
});
