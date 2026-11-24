/**
 * Pre-Travel Packing Checklist for Umrah
 * Complete categorized guide for pilgrims before departing home.
 */

export enum ChecklistCategory {
  TRAVEL_DOCUMENTS = 'TRAVEL_DOCUMENTS', // وثائق السفر
  MENS_IHRAM = 'MENS_IHRAM', // حقيبة إحرام الرجال
  WOMENS_IHRAM = 'WOMENS_IHRAM', // حقيبة إحرام المعتمرة
  HEALTH_AND_HYGIENE = 'HEALTH_AND_HYGIENE', // الصحة والعناية الشخصية
  DAILY_HARAM_ESSENTIALS = 'DAILY_HARAM_ESSENTIALS', // مستلزمات الحرم اليومية
}

export interface PackingItem {
  id: string;
  category: ChecklistCategory;
  nameAr: string;
  descriptionAr: string;
  isEssential: boolean;
}

export class PackingCatalog {
  private items: PackingItem[] = [
    // Documents
    {
      id: 'doc-passport',
      category: ChecklistCategory.TRAVEL_DOCUMENTS,
      nameAr: 'جواز السفر ساري المفعول (أكثر من 6 أشهر)',
      descriptionAr: 'مع التأشيرة الإلكترونية وصورة إضافية على الهاتف أوفلاين.',
      isEssential: true,
    },
    {
      id: 'doc-nusuk',
      category: ChecklistCategory.TRAVEL_DOCUMENTS,
      nameAr: 'تطبيق نُسك مفعل وحجز تصريح العمرة والروضة',
      descriptionAr: 'مع التقاط لقطة شاشة للباركود للعمل بدون شبكة.',
      isEssential: true,
    },
    {
      id: 'doc-tickets',
      category: ChecklistCategory.TRAVEL_DOCUMENTS,
      nameAr: 'تذاكر الطيران وبطاقة صعود الطائرة وعقد الفندق',
      descriptionAr: 'احتفظ بنسخة ورقية ورقمية لدى رفقائك.',
      isEssential: true,
    },
    // Men's Ihram
    {
      id: 'men-ihram-cloth',
      category: ChecklistCategory.MENS_IHRAM,
      nameAr: 'طقم إحرام قطني مريح (إزار ورداء)',
      descriptionAr: 'يفضل أخذ طقمين إضافيين لحالات الطوارئ والاتساخ.',
      isEssential: true,
    },
    {
      id: 'men-ihram-belt',
      category: ChecklistCategory.MENS_IHRAM,
      nameAr: 'حزام الإحرام مع جيوب بسحاب للمال والجوال',
      descriptionAr: 'لتثبيت الإزار وحفظ الأموال والوثائق دون إتلاف الإحرام.',
      isEssential: true,
    },
    {
      id: 'men-slippers',
      category: ChecklistCategory.MENS_IHRAM,
      nameAr: 'حذاء مريح يظهر الكعبين ومقدمة القدم',
      descriptionAr: 'خفيف وطبي مخصص للمشي لمسافات طويلة في الساحات.',
      isEssential: true,
    },
    // Women's Ihram
    {
      id: 'women-modest-dress',
      category: ChecklistCategory.WOMENS_IHRAM,
      nameAr: 'عباءات ساترة فضفاضة غير ملونة وغير مطرزة',
      descriptionAr: 'تجنب الأبيض والأخضر (بدعة)، وتفضيل الأسود أو الألوان غير اللافتة.',
      isEssential: true,
    },
    {
      id: 'women-khimar-sadl',
      category: ChecklistCategory.WOMENS_IHRAM,
      nameAr: 'خمار قابل للسدل على الوجه دون نقاب مفصل',
      descriptionAr: 'لسدله عند مرور الرجال الأجانب دون الحاجة لعصابة.',
      isEssential: true,
    },
    {
      id: 'women-socks',
      category: ChecklistCategory.WOMENS_IHRAM,
      nameAr: 'جوارب قطنية سوداء لستر القدمين',
      descriptionAr: 'جائزة للمرأة بالإجماع لحفظ ستر قدميها في الطواف والمشي.',
      isEssential: true,
    },
    // Health & Hygiene
    {
      id: 'hlth-unscented-soap',
      category: ChecklistCategory.HEALTH_AND_HYGIENE,
      nameAr: 'صابون وشامبو غير معطر (خالي من الروائح)',
      descriptionAr: 'ضروري للاستحمام والنظافة أثناء الإحرام دون فدية.',
      isEssential: true,
    },
    {
      id: 'hlth-vaseline',
      category: ChecklistCategory.HEALTH_AND_HYGIENE,
      nameAr: 'فازلين طبي غير معطر لمنع التسلخات والالتهابات',
      descriptionAr: 'يوضع بين الفخذين قبل الإحرام والمشي الطويل لتجنب الاحتكاك.',
      isEssential: true,
    },
    {
      id: 'hlth-personal-meds',
      category: ChecklistCategory.HEALTH_AND_HYGIENE,
      nameAr: 'الأدوية الشخصية المزمنة ومسكنات الصداع',
      descriptionAr: 'احتفظ بها في حقيبة اليد مع تقرير طبي رسمي.',
      isEssential: true,
    },
    // Daily Haram Essentials
    {
      id: 'daily-shoe-bag',
      category: ChecklistCategory.DAILY_HARAM_ESSENTIALS,
      nameAr: 'كيس قماشي خفيف لحفظ الحذاء في الحرم',
      descriptionAr: 'لتجنب ضياع الحذاء وصحبه معك داخل المطاف والمسعى.',
      isEssential: true,
    },
    {
      id: 'daily-powerbank',
      category: ChecklistCategory.DAILY_HARAM_ESSENTIALS,
      nameAr: 'شاحن متنقل (باور بانك) أصلي وسلك شحن',
      descriptionAr: 'لضمان بقاء هاتفك مشحوناً للتواصل مع المشرف واستخدام نُسك.',
      isEssential: true,
    },
    {
      id: 'daily-umbrella',
      category: ChecklistCategory.DAILY_HARAM_ESSENTIALS,
      nameAr: 'مظلة شمسية خفيفة ونظارة شمسية',
      descriptionAr: 'للحماية من أشعة الشمس في ساحات الحرمين وقت الظهيرة.',
      isEssential: false,
    },
  ];

  getItemsByCategory(category: ChecklistCategory): PackingItem[] {
    return this.items.filter((i) => i.category === category);
  }

  getAllItems(): PackingItem[] {
    return [...this.items];
  }

  calculateReadiness(checkedIds: string[]): { checked: number; total: number; percentage: number } {
    const total = this.items.length;
    const checked = this.items.filter((i) => checkedIds.includes(i.id)).length;
    const percentage = Math.round((checked / total) * 100);
    return { checked, total, percentage };
  }
}
