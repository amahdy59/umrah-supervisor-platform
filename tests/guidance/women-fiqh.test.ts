import { describe, it, expect } from 'vitest';
import {
  WomenFiqhCatalog,
  WomenFiqhTopic,
} from '../../src/guidance/women-fiqh.js';

describe('WomenFiqhCatalog - احكام المرأة في العمرة', () => {
  const catalog = new WomenFiqhCatalog();

  it('should contain all 11 core verified rulings including Istihadah distinction', () => {
    const items = catalog.getAllItems();
    expect(items.length).toBe(11);
  });

  it('should correctly clarify Miqat menstruation rulings (Ghusl, Ihram, but delay Tawaf)', () => {
    const item = catalog.getItemByTopic(WomenFiqhTopic.MIQAT_MENSTRUATION);
    expect(item).toBeDefined();
    expect(item?.rulingAr).toContain('تغتسل وتُحرم مع الناس من الميقات وجوباً');
    expect(item?.rulingAr).toContain('لا تطوف بالبيت حتى تطهر');
    expect(item?.practicalGuidance).toContain('لا يجوز لها تجاوز الميقات دون إحرام');
    expect(item?.sourceText).toContain('افْعَلِي مَا يَفْعَلُ الْحَاجُّ');
  });

  it('should clarify Istihadah does not prohibit Tawaf', () => {
    const item = catalog.getItemByTopic(WomenFiqhTopic.ISTIHADAH_DIFFERENCE);
    expect(item).toBeDefined();
    expect(item?.rulingAr).toContain('لا تمنع من الصلاة ولا من الطواف');
  });

  it('should rule on Ihram clothes forbidding Niqab and gloves only, with no designated color', () => {
    const clothes = catalog.getItemByTopic(WomenFiqhTopic.IHRAM_CLOTHING);
    expect(clothes?.rulingAr).toContain('النقاب (البُرقُع) والقفازان');

    const bidahColor = catalog.getItemByTopic(WomenFiqhTopic.WHITE_GREEN_BIDAH);
    expect(bidahColor?.rulingAr).toContain('تخصيص ثوب أبيض أو أخضر لإحرام المرأة لا أصل له');
  });

  it('should allow Sadl (draping cloth) when men are present without forehead sponges/turbans', () => {
    const sadl = catalog.getItemByTopic(WomenFiqhTopic.FACE_VEIL_SADL);
    expect(sadl?.rulingAr).toContain('تسدل خمارها');
    expect(sadl?.rulingAr).toContain('ولا يضر إن مس الخمار وجهها');
  });

  it('should confirm that Ramal, Idtiba, and Herwala do not apply to women', () => {
    const noRamal = catalog.getItemByTopic(WomenFiqhTopic.TAWAF_NO_RAMAL);
    expect(noRamal?.rulingAr).toContain('لا رمل ولا اضطباع ولا هرولة على النساء');
    expect(noRamal?.practicalGuidance).toContain('تمشي المرأة مشياً عادياً');
  });

  it('should allow Sai if menstruation starts after Tawaf', () => {
    const mAfterTawaf = catalog.getItemByTopic(WomenFiqhTopic.MENSTRUATION_AFTER_TAWAF);
    expect(mAfterTawaf?.rulingAr).toContain('تسعى بين الصفا والمروة وهي حائض وتتم عمرتها');
  });

  it('should instruct Taqseer (fingertip length ~1.5-2cm) and forbid shaving head', () => {
    const taqseer = catalog.getItemByTopic(WomenFiqhTopic.TAQSEER_HAIR_CUT);
    expect(taqseer?.rulingAr).toContain('الواجب عليها التقصير فقط');
    expect(taqseer?.practicalGuidance).toContain('أنملة الأصبع');
    expect(taqseer?.practicalGuidance).toContain('في غرفتها بالفندق');
  });

  it('should enumerate the 8 conditions for Sharia Hijab in Haramain', () => {
    const hijab = catalog.getItemByTopic(WomenFiqhTopic.SHARIA_HIJAB_CONDITIONS);
    expect(hijab?.practicalGuidance).toContain('1. ساتر لجميع البدن');
    expect(hijab?.practicalGuidance).toContain('8. ليس ثوب شهرة');
  });

  it('should allow socks and ordinary sewn shoes for women in Ihram', () => {
    const socks = catalog.getItemByTopic(WomenFiqhTopic.SHOE_SOCKS_PERMITTED);
    expect(socks?.rulingAr).toContain('يجوز للمرأة المحرمة لبس الجوارب');
  });

  it('should guide women regarding the Prophet Mosque prayer and scholarly nuance on cemeteries', () => {
    const mosque = catalog.getItemByTopic(WomenFiqhTopic.VISITING_PROPHET_MOSQUE);
    expect(mosque?.rulingAr).toContain('المسجد النبوي ودخول الروضة الشريفة بتصريح نسك');
    expect(mosque?.practicalGuidance).toContain('لَعَنَ الله زَوَّارَاتِ القُبُورِ');
  });
});
