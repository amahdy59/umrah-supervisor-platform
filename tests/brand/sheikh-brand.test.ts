import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  BRAND_FEATURED_VIDEOS,
  BRAND_IMAGES,
  BRAND_PILLARS,
  BRAND_SOCIAL_LINKS,
  BRAND_STATS,
  MARKETING_BROADCAST_TEMPLATES,
  SHEIKH_BRAND,
  WHATSAPP_DIRECT_INTENTS,
  buildMostafaDirectWhatsAppUrl,
} from '../../src/brand/sheikh-brand.js';

const ROOT_DIR = process.cwd();

describe('Sheikh Mostafa Flefel / Abshirou Brand Data', () => {
  it('stores verified official contact numbers, Granada license 1094, and WhatsApp group link', () => {
    expect(SHEIKH_BRAND.agencyLicense).toBe('1094');
    expect(SHEIKH_BRAND.contact.umrahWhatsappDisplay).toBe('01040414659');
    expect(SHEIKH_BRAND.contact.umrahWhatsappIntl).toBe('+201040414659');
    expect(SHEIKH_BRAND.contact.agencyPhoneDisplay).toBe('01041060008');
    expect(SHEIKH_BRAND.contact.whatsappGroupUrl).toBe(
      'https://chat.whatsapp.com/JKJgvqRVRAD0mJ4ThjkLVh'
    );
    expect(buildMostafaDirectWhatsAppUrl('السلام عليكم')).toContain(
      'https://wa.me/201040414659?text='
    );
  });

  it('includes only verified active social channels and excludes dead/broken handles', () => {
    const urls = BRAND_SOCIAL_LINKS.map((link) => link.url);
    expect(urls).toContain(
      'https://www.facebook.com/people/%D8%A3%D8%A8%D8%B4%D8%B1%D9%88%D8%A7-%D9%85%D8%B5%D8%B7%D9%81%D9%89-%D9%81%D9%84%D9%8A%D9%81%D9%84/100064043891945/'
    );
    expect(urls).toContain('https://www.facebook.com/mstfy.flyfl/');
    expect(urls).toContain('https://www.youtube.com/@apopara14');
    expect(urls).toContain('https://www.instagram.com/apshro14/');
    expect(urls).toContain('https://chat.whatsapp.com/JKJgvqRVRAD0mJ4ThjkLVh');

    const serialized = JSON.stringify({
      BRAND_SOCIAL_LINKS,
      BRAND_FEATURED_VIDEOS,
      MARKETING_BROADCAST_TEMPLATES,
      WHATSAPP_DIRECT_INTENTS,
    });
    expect(serialized).not.toContain('mustafa_flyfl');
    expect(serialized).not.toContain('mostafafelefl33');
    expect(serialized).not.toContain('tiktok.com/@apshro14');
  });

  it('removes excluded women/girl image files and precaches only curated Sheikh & Haramain images', () => {
    const swContent = fs.readFileSync(path.join(ROOT_DIR, 'public/sw.js'), 'utf8');
    expect(swContent).toContain('umrah-companion-v17');

    const excludedBrandFiles = [
      'abshirou-fb-cover.jpg',
      'abshirou-yt-avatar.jpg',
      'sheikh-mostafa-ihram.jpg',
      'sheikh-mostafa-haram-cover.jpg',
    ];
    excludedBrandFiles.forEach((fname) => {
      expect(fs.existsSync(path.join(ROOT_DIR, 'public/images/brand', fname))).toBe(false);
      expect(swContent).not.toContain(fname);
      expect(JSON.stringify(BRAND_IMAGES)).not.toContain(fname);
    });

    Object.values(BRAND_IMAGES).forEach((img) => {
      expect(img.src.startsWith('/images/')).toBe(true);
      expect(img.width).toBeGreaterThan(0);
      expect(img.height).toBeGreaterThan(0);
      expect(img.alt.ar.trim().length).toBeGreaterThan(5);
      expect(img.alt.en.trim().length).toBeGreaterThan(5);

      const diskPath = path.join(ROOT_DIR, 'public', img.src);
      expect(fs.existsSync(diskPath)).toBe(true);
      expect(fs.statSync(diskPath).size).toBeGreaterThan(10000);
      expect(swContent).toContain(img.src);
    });
  });

  it('provides non-empty Arabic and English copy across stats, intents, pillars, videos, and templates', () => {
    BRAND_STATS.forEach((stat) => {
      expect(stat.value.ar.trim().length).toBeGreaterThan(0);
      expect(stat.value.en.trim().length).toBeGreaterThan(0);
      expect(stat.label.ar.trim().length).toBeGreaterThan(0);
      expect(stat.label.en.trim().length).toBeGreaterThan(0);
    });

    expect(WHATSAPP_DIRECT_INTENTS.length).toBeGreaterThanOrEqual(4);
    WHATSAPP_DIRECT_INTENTS.forEach((intent) => {
      expect(intent.label.ar.trim().length).toBeGreaterThan(0);
      expect(intent.label.en.trim().length).toBeGreaterThan(0);
      expect(intent.template.ar.trim().length).toBeGreaterThan(10);
      expect(intent.template.en.trim().length).toBeGreaterThan(10);
    });

    BRAND_PILLARS.forEach((p) => {
      expect(p.title.ar.trim().length).toBeGreaterThan(0);
      expect(p.title.en.trim().length).toBeGreaterThan(0);
      expect(p.desc.ar.trim().length).toBeGreaterThan(0);
      expect(p.desc.en.trim().length).toBeGreaterThan(0);
    });

    BRAND_FEATURED_VIDEOS.forEach((v) => {
      expect(v.url).toMatch(/^https:\/\/www\.youtube\.com\/watch\?v=/);
      expect(v.title.ar.trim().length).toBeGreaterThan(0);
      expect(v.title.en.trim().length).toBeGreaterThan(0);
    });

    MARKETING_BROADCAST_TEMPLATES.forEach((tpl) => {
      expect(tpl.message.ar).toContain('1094');
      expect(tpl.message.en).toContain('1094');
      expect(tpl.message.ar).toContain('01040414659');
      expect(tpl.message.en.replace(/\s+/g, '')).toContain('201040414659');
    });
  });
});
