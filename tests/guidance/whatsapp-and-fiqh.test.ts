import { describe, it, expect } from 'vitest';
import {
  WhatsAppBroadcastManager,
  BroadcastPhase,
  FiqhAssistant,
  FiqhRulingCategory,
} from '../../src/guidance/whatsapp-and-fiqh.js';

describe('WhatsApp Broadcast Manager', () => {
  const manager = new WhatsAppBroadcastManager();

  it('provides pre-formatted broadcast posts across all critical Umrah phases', () => {
    const phases = manager.getAllPhases();
    expect(phases).toContain(BroadcastPhase.PRE_DEPARTURE);
    expect(phases).toContain(BroadcastPhase.MIQAT_APPROACH);
    expect(phases).toContain(BroadcastPhase.ROOMMATE_ETIQUETTE);
    expect(phases).toContain(BroadcastPhase.TAWAF_PREPARATION);
    expect(phases).toContain(BroadcastPhase.HARAMAIN_MORALS);
    expect(phases).toContain(BroadcastPhase.RAWDAH_PERMIT);
    expect(phases).toContain(BroadcastPhase.DEPARTURE_WADA);
  });

  it('formats roommate etiquette broadcast with practical courtesy rules', () => {
    const post = manager.getFormattedPost(BroadcastPhase.ROOMMATE_ETIQUETTE, {
      hotelName: 'أبراج الكسوة',
      supervisorName: 'الشيخ أحمد',
    });

    expect(post.title).toContain('ميثاق رفقاء الغرفة');
    expect(post.messageBody).toContain('مراعاة مواعيد النوم والراحة');
    expect(post.messageBody).toContain('إتيكيت استخدام الحمام المشترك');
    expect(post.messageBody).toContain('أبراج الكسوة');
    expect(post.messageBody).toContain('الشيخ أحمد');
  });

  it('formats Miqat approach announcement with Talbiyah and Ihram reminders', () => {
    const post = manager.getFormattedPost(BroadcastPhase.MIQAT_APPROACH, {
      tripTitle: 'عمرة شعبان 1447',
    });

    expect(post.messageBody).toContain('لَبَّيْكَ اللَّهُمَّ عُمْرَةً');
    expect(post.messageBody).toContain('محظورات الإحرام');
  });
});

describe('Fiqh Assistant & Common Mistakes Engine', () => {
  const fiqh = new FiqhAssistant();

  it('resolves lap count doubt by applying the certainty principle (the lesser count)', () => {
    const resolution = fiqh.resolveLapDoubt(3, 4);
    expect(resolution.recommendedLap).toBe(3);
    expect(resolution.rulingArabic).toContain('البناء على اليقين وهو الأقل');
  });

  it('provides ruling for accidental perfume or scent during Ihram', () => {
    const ruling = fiqh.getRuling(FiqhRulingCategory.ACCIDENTAL_SCENT);
    expect(ruling).toBeDefined();
    expect(ruling?.titleAr).toContain('استخدام العطر أو الصابون المعطر ناسياً');
    expect(ruling?.actionRequired).toContain('غسله بالماء فور تذكره ولا فدية عليه');
  });

  it('provides ruling for cutting hair or nails out of forgetfulness', () => {
    const ruling = fiqh.getRuling(FiqhRulingCategory.FORGETFUL_HAIR_NAIL_CLIP);
    expect(ruling).toBeDefined();
    expect(ruling?.actionRequired).toContain('لا فدية عليه عند جمهور العلماء للنسيان');
  });
});
