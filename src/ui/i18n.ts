export type UiLanguage = 'ar' | 'en';

const LANG_STORAGE_KEY = 'umrah_ui_lang';

const DICTIONARY: Record<string, { ar: string; en: string }> = {
  // App Shell & Skip Link
  'nav.skip': { ar: 'تخطي إلى المحتوى الرئيسي', en: 'Skip to main content' },
  'app.pilgrim.title': { ar: 'أبشروا | رفيق المعتمر — الشيخ مصطفى فليفل', en: 'Abshirou | Pilgrim Companion — Sheikh Mostafa Flefel' },
  'app.supervisor.title': { ar: 'أبشروا | غرفة عمليات المشرف — الشيخ مصطفى فليفل', en: 'Abshirou | Supervisor Mission Control — Sheikh Mostafa Flefel' },
  'app.supervisor.subtitle': {
    ar: 'شركة غرناطة للسياحة (ترخيص ١٠٩٤) • إدارة الأفواج، سجل الأشخاص، والأقساط',
    en: 'Granada Tourism (License #1094) • Multi-Group Operations, CRM & Installments',
  },
  'app.pilgrim.footer': {
    ar: 'أبشروا — الشيخ مصطفى فليفل (غرناطة للسياحة ترخيص ١٠٩٤) • يعمل بدون إنترنت •',
    en: 'Abshirou — Sheikh Mostafa Flefel (Granada Tourism #1094) • Works Offline •',
  },
  'app.pilgrim.supervisorLink': { ar: 'دخول بوابة المشرفين', en: 'Supervisor Portal' },

  // Pilgrim Navigation (Consolidated 4 Pillars + Abshirou Brand Hub + Tools Popover)
  'nav.rituals': { ar: '🤲 مناسكي والرحلة', en: '🤲 My Umrah' },
  'nav.fiqh': { ar: '📖 الفقه والمصادر', en: '📖 Fiqh & Sources' },
  'nav.packing': { ar: '🧳 حقيبتي والخدمات', en: '🧳 Trip Wallet' },
  'nav.gates': { ar: '⛩️ الحرمين والمزارات', en: '⛩️ Haramain & Gates' },
  'nav.atlas': { ar: '⛩️ الحرمين والمزارات', en: '⛩️ Haramain & Gates' },
  'nav.abshirou': { ar: '✨ أبشروا والتواصل', en: '✨ Abshirou & Contact' },
  'nav.ziyarat': { ar: '🕌 المزارات والميقات', en: '🕌 Ziyarat & Miqat' },
  'nav.women': { ar: '🧕 فقه المرأة', en: '🧕 Women Fiqh' },
  'nav.more': { ar: '⚙️ الأدوات', en: '⚙️ Tools' },
  'nav.popoverTitle': { ar: 'إعدادات العرض واللغة والوصول', en: 'Display, Language & Accessibility' },
  'nav.mobile.rituals': { ar: 'مناسكي', en: 'My Umrah' },
  'nav.mobile.fiqh': { ar: 'الفقه', en: 'Fiqh' },
  'nav.mobile.packing': { ar: 'حقيبتي', en: 'Wallet' },
  'nav.mobile.gates': { ar: 'الحرمين', en: 'Haramain' },
  'nav.mobile.more': { ar: 'الأدوات', en: 'Tools' },

  // Supervisor Navigation (Consolidated 6 Hubs)
  'sup.nav.manifest': { ar: '🚌 الأفواج والتسكين', en: '🚌 Groups & Rooming' },
  'sup.nav.people': { ar: '👥 سجل الأشخاص', en: '👥 People CRM' },
  'sup.nav.gameya': { ar: '💰 الأقساط والجمعية', en: '💰 Installments' },
  'sup.nav.whatsapp': { ar: '💬 رسائل الواتساب', en: '💬 WhatsApp Messages' },
  'sup.nav.print': { ar: '🖨️ الطباعة و QR', en: '🖨️ Print & QR' },
  'sup.nav.sos': { ar: '🚨 الطوارئ', en: '🚨 SOS Center' },
  'sup.nav.women': { ar: '🧕 فقه النساء', en: '🧕 Women Guide' },
  'sup.nav.atlas': { ar: '⛩️ أطلس الحرمين', en: '⛩️ Haramain Atlas' },
  'sup.nav.logistics': { ar: '🧳 الأمتعة والطب والطباعة', en: '🧳 Ops, Health & Print' },
  'sup.nav.mobile.manifest': { ar: 'الأفواج', en: 'Groups' },
  'sup.nav.mobile.people': { ar: 'الأشخاص', en: 'People' },
  'sup.nav.mobile.gameya': { ar: 'الأقساط', en: 'Payments' },
  'sup.nav.mobile.whatsapp': { ar: 'الواتساب', en: 'WhatsApp' },
  'sup.popoverTitle': { ar: 'عمليات وإعدادات المشرف', en: 'Supervisor Operations & Tools' },

  // Shared Header Tools
  'tools.sos': { ar: 'طوارئ', en: 'SOS' },
  'tools.senior': { ar: 'وضع كبار السن', en: 'Senior Mode' },
  'tools.seniorActive': { ar: 'خط كبير: مُفعّل', en: 'Large Text: ON' },
  'tools.theme': { ar: 'الوضع الليلي', en: 'Dark Mode' },
  'tools.themeLight': { ar: 'الوضع النهاري', en: 'Light Mode' },
  'tools.wake': { ar: 'منع إغلاق الشاشة', en: 'Keep Screen On' },
  'tools.wakeActive': { ar: 'الشاشة مضاءة ✓', en: 'Screen Awake ✓' },
  'tools.lang': { ar: '🌐 English', en: '🌐 العربية' },
  'tools.netOnline': { ar: 'جاهز أوفلاين ✅', en: 'Offline Ready ✅' },
  'tools.netOffline': { ar: 'وضع بدون إنترنت 📴', en: 'Offline Mode 📴' },
  'tools.newGroup': { ar: '➕ فوج جديد', en: '➕ New Group' },
  'tools.settings': { ar: '⚙️ إعدادات الفوج', en: '⚙️ Group Settings' },
  'tools.sync': { ar: '☁️ مزامنة', en: '☁️ Sync' },
  'tools.pinLock': { ar: '🔒 قفل', en: '🔒 Lock' },
  'tools.pilgrimApp': { ar: '🤲 تطبيق المعتمر', en: '🤲 Pilgrim App' },

  // Prayer Bar & Badge
  'prayer.makkahBtn': { ar: '🕋 مكة', en: '🕋 Makkah' },
  'prayer.madinahBtn': { ar: '🕌 المدينة', en: '🕌 Madinah' },
  'prayer.nextLabel': { ar: 'الصلاة القادمة', en: 'Next Prayer' },
  'prayer.nextSunrise': { ar: 'موعد الشروق القادم', en: 'Upcoming Sunrise' },
  'prayer.passed': { ar: '✓ انتهى', en: '✓ Passed' },
  'prayer.upcoming': { ar: 'قادم', en: 'Upcoming' },
  'prayer.tomorrow': { ar: '⏳ غداً', en: '⏳ Tomorrow' },
  'prayer.nextBadge': { ar: '⏳ القادم', en: '⏳ Next' },
  'prayer.gridLabel': { ar: 'مواقيت الصلوات والشروق', en: 'Daily Prayer & Sunrise Times' },
  'prayer.scheduleToggle': { ar: '📅 جدول المواقيت الـ 6 لليوم', en: '📅 Today’s 6 Prayer & Sunrise Times' },
  'quick.title': { ar: '⚡ مواقف فورية داخل الحرم', en: '⚡ Quick Help Inside Al-Haram' },
  'quick.lost': { ar: '🆘 ضعت / أقرب بوابة', en: '🆘 Lost / Nearest Gate' },
  'quick.wudu': { ar: '💧 انتقض وضوئي بالطواف', en: '💧 Wudu Broke Mid-Tawaf' },
  'quick.miqat': { ar: '✈️ تجاوزت الميقات', en: '✈️ Missed Miqat Alert' },
  'quick.cart': { ar: '♿ عربة / كرسي نُسك', en: '♿ Wheelchair / Cart' },
  'atlas.filter.ziyarat': { ar: '🕌 المزارات والميقات', en: '🕌 Ziyarat & Miqat' },
  'atlas.filter.services': { ar: '🎁 المنافع والأنظمة الرسمية', en: '🎁 Services & Field Rules' },
  'fiqh.unifiedTitle': { ar: '📖 موسوعة الفقه وأحكام المعتمرة (موثقة بالأدلة)', en: '📖 Referenced Fiqh & Women’s Umrah Rulings' },
  'fiqh.searchLabel': { ar: 'ابحث في المسائل الفقهية وأحكام المرأة:', en: 'Search Fiqh & Women’s rulings:' },
  'fiqh.filter.all': { ar: '📚 الكل', en: '📚 All' },
  'fiqh.filter.ihram': { ar: '✈️ الإحرام والميقات', en: '✈️ Ihram & Miqat' },
  'fiqh.filter.tawaf': { ar: '🕋 الطواف والسعي', en: '🕋 Tawaf & Sa’i' },
  'fiqh.filter.women': { ar: '🧕 فقه المرأة', en: '🧕 Women Fiqh' },
  'sup.whatsapp.subTabs.posts': { ar: '💬 منشورات الواتساب (موجهة بالمرحلة)', en: '💬 Stage Broadcasts' },
  'sup.whatsapp.subTabs.women': { ar: '🧕 إرشاد الأخوات والروضة', en: '🧕 Women & Rawdah' },
  'sup.whatsapp.subTabs.atlas': { ar: '⛩️ مرجع البوابات والمزارات', en: '⛩️ Gates & Ziyarat Reference' },
  'badge.cardTitle': { ar: 'بطاقة معتمر رقمية', en: 'Digital Pilgrim Badge' },
  'badge.editBtn': { ar: '✏️ تعديل بياناتي', en: '✏️ Edit Profile' },
  'badge.hotelLabel': { ar: 'الفندق بمكة:', en: 'Makkah Hotel:' },
  'badge.roomLabel': { ar: 'رقم الغرفة:', en: 'Room No.:' },
  'badge.busLabel': { ar: 'رقم الباص:', en: 'Bus No.:' },
  'badge.supPhoneLabel': { ar: 'هاتف المشرف:', en: 'Supervisor Phone:' },
  'badge.taxiBtn': { ar: '🚕 كارت التاكسي والأمن', en: '🚕 Taxi & Security Card' },
  'badge.nusukBtn': { ar: '📲 تصريح نُسك', en: '📲 Nusuk Permits' },
  'badge.accountBtn': { ar: '💳 حسابي وأقساطي', en: '💳 My Installments' },
  'badge.certBtn': { ar: '📜 الشهادة', en: '📜 Certificate' },
  'sos.cardTitle': { ar: '🚨 نداء الطوارئ ونقطة التجمع', en: '🚨 SOS Emergency & Meeting Point' },
  'sos.cardBadge': { ar: 'GPS + واتساب', en: 'GPS + WhatsApp' },
  'sos.cardDesc': {
    ar: 'إذا ضللت الطريق في الحرم، قف عند أقرب باب مرقم أو عمود مميز، واضغط الزر لإرسال موقعك الجغرافي للمشرف وإظهار بطاقة الفندق لرجل الأمن.',
    en: 'If you get lost inside the Haram, stand near the nearest numbered gate or pillar and tap below to send your GPS coordinates to your supervisor.',
  },
  'sos.meetingLabel': { ar: 'نقطة التجمع المعتمدة لفوجكم:', en: 'Group Meeting Point:' },
  'sos.triggerBtn': { ar: '🆘 أنا تائه — إرسال موقعي للمشرف', en: '🆘 Lost — Send My Location to Supervisor' },
  'sos.callBtn': { ar: '📞 اتصال مباشر', en: '📞 Call Supervisor' },

  // Rituals (Talbiyah, Tawaf, Sai, Focus)
  'talbiyah.title': {
    ar: '🔊 التلبية النبوية (من الميقات حتى بدء الطواف)',
    en: '🔊 Prophetic Talbiyah (Miqat until Tawaf)',
  },
  'talbiyah.badge': { ar: 'سُنّة الإحرام المؤكدة', en: 'Confirmed Ihram Sunnah' },
  'talbiyah.playBtn': { ar: 'تشغيل التلبية بالتكرار التلقائي', en: 'Play Talbiyah Loop' },
  'talbiyah.pauseBtn': { ar: 'إيقاف التلبية النبوية', en: 'Pause Talbiyah' },
  'talbiyah.stopBtn': { ar: '⏹️ إيقاف', en: '⏹️ Stop' },
  'tawaf.title': { ar: '🕋 عداد الطواف التفاعلي (7 أشواط)', en: '🕋 Interactive Tawaf Counter (7 Laps)' },
  'tawaf.reset': { ar: 'إعادة', en: 'Reset' },
  'tawaf.hint': {
    ar: 'الشوط الحالي (يبدأ وينتهي بمحاذاة الحجر الأسود — الكعبة عن يسارك)',
    en: 'Current Lap (Start/End aligned with Black Stone — Kaaba on your left)',
  },
  'tawaf.nextBtn': { ar: '✅ إتمام الشوط للتالي', en: '✅ Complete Lap' },
  'tawaf.ruknBtn': { ar: '📍 دعاء الركن اليماني', en: '📍 Yamani Corner Dua' },
  'tawaf.doubtBtn': {
    ar: '⚖️ نسيت أنا في أي شوط؟ احسب القاعدة الفقهية',
    en: '⚖️ Forgot lap count? Fiqh Uncertainty Rule',
  },
  'tawaf.focusBtn': { ar: '🎯 وضع الطواف المركّز (بدون تشتيت)', en: '🎯 Tawaf Focus Mode (Distraction-Free)' },
  'sai.title': { ar: '🚶‍♂️ عداد السعي بين الصفا والمروة', en: "🚶‍♂️ Sa'i Counter (Safa & Marwah)" },
  'sai.nextBtn': { ar: '✅ وصول الشوط للتالي', en: '✅ Reached Hill — Next Lap' },
  'sai.safaBtn': { ar: '⛰️ ذكر الوقوف على الصفا والمروة (صحيح مسلم)', en: '⛰️ Dhikr on Safa & Marwah (Sahih Muslim)' },
  'sai.focusBtn': { ar: '🎯 وضع السعي المركّز (بدون تشتيت)', en: "🎯 Sa'i Focus Mode (Distraction-Free)" },

  // Atlas, Ziyarat & Gates Headers & Filters
  'atlas.title': {
    ar: '⛩️ أطلس أبواب الكعبة والحرمين الشريفين ومنافعهما (بالصور الحقيقية)',
    en: '⛩️ Al-Haramain Gates, Kaaba Zones & Services Atlas (Real Photos)',
  },
  'atlas.badge': { ar: 'مكة المكرمة + المدينة المنورة', en: 'Makkah + Madinah' },
  'atlas.intro': {
    ar: 'تعرّف بالصور الواقعية على باب الكعبة المشرفة والملتزم وحِجر إسماعيل والمسعى، وأهم بوابات المسجد الحرام والمسجد النبوي، مع شرح كل الخدمات والمنافع المجانية المتاحة لخدمة المعتمر وكبار السن.',
    en: 'Explore real photography of the Kaaba zones, Masa, and numbered gates across Makkah & Madinah, along with free wheelchairs, Zamzam stations, clinics, and accessibility services.',
  },
  'atlas.filter.all': { ar: '🕌 الكل', en: '🕌 All' },
  'atlas.filter.kaaba': { ar: '🕋 الكعبة والمسعى', en: '🕋 Kaaba & Masa' },
  'atlas.filter.makkah': { ar: '🚪 أبواب الحرم المكي', en: '🚪 Makkah Gates' },
  'atlas.filter.madinah': { ar: '🌴 المسجد النبوي والروضة', en: '🌴 Madinah & Rawdah' },
  'atlas.benefitsTitle': {
    ar: '🎁 الخدمات والمنافع المجانية وفضائل العبادة داخل الحرمين',
    en: '🎁 Free Services, Senior Accessibility & Blessings Inside Al-Haramain',
  },
  'atlas.benefitsBadge': { ar: 'اغتنمها في رحلتك', en: 'Essential Pilgrim Benefits' },
  'ziyarat.miqatTitle': { ar: '🧭 دليل الميقات حسب مسار سفرك', en: '🧭 Miqat Guide by Travel Route' },
  'ziyarat.miqatBadge': { ar: 'طيران / باص / قطار الحرمين', en: 'Flight / Bus / Haramain Train' },
  'ziyarat.madinahHeading': { ar: '🌴 مزارات المدينة المنورة', en: '🌴 Madinah Historical Ziyarat Sites' },
  'ziyarat.makkahHeading': { ar: '🕋 معالم مكة المكرمة', en: '🕋 Makkah Landmarks & Shrines' },
  'ziyarat.fieldTitle': {
    ar: '🏛️ إرشادات ميدانية رسمية بالحرمين والمطار (العربات، زمزم، والضياع)',
    en: '🏛️ Official Field Guides (Wheelchairs, Zamzam Rules & Lost Item Protocol)',
  },
  'ziyarat.fieldBadge': { ar: 'مصادر رسمية موثقة', en: 'Verified Official Guidance' },

  // Gates & Compass
  'gates.title': { ar: '🧭 دليل بوابات الحرم المكي المصحح ومسار الفندق', en: '🧭 Corrected Haram Gates & Hotel Wayfinder' },
  'gates.atlasBtn': { ar: '⛩️ أطلس كل الأبواب والمنافع بالصور', en: '⛩️ Full Photo Atlas' },
  'gates.hotelLabel': { ar: 'اختر منطقة فندق إقامتك:', en: 'Select Your Hotel Area:' },
  'compass.btn': { ar: '🧭 حدد أقرب بوابة لي الآن (GPS)', en: '🧭 Find Nearest Gate Now (GPS)' },

  // Supervisor Atlas & Filters
  'sup.atlas.title': {
    ar: '⛩️ الدليل المصوّر لأبواب الحرمين ومنافعهما والمعالم (مرجع المشرف)',
    en: '⛩️ Al-Haramain Gates, Services & Ziyarat Photo Reference (Supervisor)',
  },
  'sup.atlas.badge': { ar: 'صور حقيقية لمكة والمدينة', en: 'Authentic Makkah & Madinah Photos' },
  'sup.atlas.filter.all': { ar: '🕌 الكل', en: '🕌 All' },
  'sup.atlas.filter.makkah': { ar: '🕋 مكة وأبوابها', en: '🕋 Makkah & Gates' },
  'sup.atlas.filter.madinah': { ar: '🌴 المدينة والروضة', en: '🌴 Madinah & Rawdah' },
  'sup.atlas.filter.ziyarat': { ar: '⛰️ المزارات والمشاعر', en: '⛰️ Ziyarat Sites' },
  'sup.atlas.benefitsTitle': {
    ar: '🎁 منافع وخدمات الحرمين الشريفين للمعتمرين',
    en: '🎁 Free Al-Haramain Services & Pilgrim Support',
  },

  // Fiqh, Women Fiqh, Packing, Currency & Taxi (Deep i18n)
  'fiqh.doubtTitle': {
    ar: '⚖️ حاسبة الشك في عدد أشواط الطواف والسعي',
    en: "⚖️ Tawaf / Sa'i Lap Uncertainty Calculator",
  },
  'fiqh.doubtBadge': { ar: 'قاعدة: البناء على اليقين', en: 'Rule: Build on Certainty' },
  'fiqh.doubtLabel1': { ar: 'شككت هل طفت:', en: 'Unsure if I completed:' },
  'fiqh.doubtLabel2': { ar: 'أم:', en: 'or:' },
  'fiqh.doubtBtn': { ar: 'احسب الحكم الشرعي', en: 'Calculate Fiqh Ruling' },
  'fiqh.rulingsTitle': {
    ar: '📖 مسائل فقهية شائعة وجبر النواقص (مع الأدلة)',
    en: '📖 Common Umrah Fiqh Issues & Remedies (With Evidence)',
  },
  'fiqh.roommateTitle': {
    ar: '🤝 ميثاق السكن المشترك وأخلاق رفقاء الغرفة',
    en: '🤝 Shared Room Charter & Pilgrim Etiquette',
  },
  'fiqh.roommateBadge': { ar: 'آداب الصحبة في العمرة', en: 'Travel Companionship Ethics' },
  'women.title': {
    ar: '🧕 دليل فقه وأحكام المرأة في العمرة والزيارة',
    en: "🧕 Women's Fiqh in Umrah & Madinah Visits",
  },
  'women.badge': { ar: 'مستخلص من «دليل المعتمر»', en: 'Verified Scholarly Rulings' },
  'women.intro': {
    ar: 'أحكام موثقة للمرأة المعتمرة (الحيض عند الميقات، الاستحاضة، النقاب والسدل، وتخصيص الألوان)، وفق فتاوى كبار العلماء مع الإشارة للمعتبر من الخلاف في مسائل الزيارة.',
    en: 'Verified rulings for female pilgrims (menstruation at Miqat, istihadah spotting, niqab/gloves alternatives, hair trimming, and visiting Al-Rawdah).',
  },
  'women.searchLabel': { ar: 'ابحثي في أحكام المرأة:', en: "Search women's fiqh topics:" },
  'packing.title': {
    ar: '🧳 مؤشر جاهزية حقيبة المعتمر (محفوظ تلقائياً)',
    en: '🧳 Pilgrim Packing Readiness Tracker (Auto-Saved)',
  },
  'packing.resetBtn': { ar: '🔄 إعادة تعيين', en: '🔄 Reset Checklist' },
  'packing.pctLabel': { ar: 'نسبة اكتمال تجهيز أغراض الرحلة:', en: 'Trip packing readiness progress:' },
  'packing.docsTitle': { ar: '📄 وثائق السفر والتصاريح', en: '📄 Travel Documents & Permits' },
  'packing.requiredBadge': { ar: 'إلزامي', en: 'Mandatory' },
  'packing.menTitle': { ar: '👔 حقيبة إحرام الرجال', en: "👔 Men's Ihram Essentials" },
  'packing.womenTitle': { ar: '🧕 حقيبة المعتمرة', en: "🧕 Women's Ihram Essentials" },
  'packing.healthTitle': { ar: '🧼 الصحة والعناية (بدون عطر)', en: '🧼 Health & Fragrance-Free Hygiene' },
  'packing.dailyTitle': { ar: '🕌 مستلزمات الحرم اليومية', en: '🕌 Daily Al-Haramain Essentials' },
  'packing.nusukTitle': {
    ar: '📲 محفظة لقطات تصاريح نُسك (تعمل أوفلاين)',
    en: '📲 Offline Nusuk Permit Screenshot Wallet',
  },
  'packing.nusukBadge': { ar: 'حفظ محلي', en: 'Saved Locally' },
  'packing.nusukIntro': {
    ar: 'ارفع لقطات شاشة واضحة لباركود تصريح العمرة أو الروضة من تطبيق «نُسك» لتصل إليها فوراً عند ضعف الشبكة داخل الحرم (مع إبقاء التطبيق الأصلي جاهزاً ورفع سطوع الشاشة).',
    en: 'Upload clear QR screenshots of your Umrah or Rawdah Nusuk permits for instant offline access inside Al-Haramain.',
  },
  'packing.umrahPermit': { ar: '🕋 تصريح العمرة', en: '🕋 Umrah Permit' },
  'packing.rawdahPermit': { ar: '🕌 تصريح الروضة الشريفة', en: '🕌 Rawdah Permit' },
  'packing.uploadUmrah': { ar: '📤 رفع لقطة تصريح العمرة', en: '📤 Upload Umrah Screenshot' },
  'packing.uploadRawdah': { ar: '📤 رفع لقطة تصريح الروضة', en: '📤 Upload Rawdah Screenshot' },
  'gates.currencyTitle': { ar: '💱 محول العملات (بسعر قابل للتعديل)', en: '💱 Currency Converter (Editable Rate)' },
  'gates.sarLabel': { ar: 'المبلغ بالريال السعودي (SAR):', en: 'Amount in Saudi Riyal (SAR):' },
  'gates.rateLabel': { ar: 'سعر الصرف (1 ريال = ج.م):', en: 'Exchange Rate (1 SAR = EGP):' },
  'gates.egpBox': { ar: 'بالجنيه المصري (EGP)', en: 'In Egyptian Pounds (EGP)' },
  'gates.usdBox': { ar: 'بالدولار الأمريكي (USD)', en: 'In US Dollars (USD)' },
  'gates.taxiTitle': { ar: '🚕 الأسعار الاسترشادية لسيارات الأجرة والنقل', en: '🚕 Official Reference Taxi & Transit Fares' },
  'gates.taxiBadge': { ar: 'حماية من الاستغلال', en: 'Fair-Fare Protection' },
  'gates.officialTitle': { ar: '🏛️ دليل الجهات الرسمية وأرقام الطوارئ بالمملكة', en: '🏛️ Official Saudi Authorities & 24/7 Hotlines' },
  'gates.officialBadge': { ar: 'مصادر موثوقة 24/7', en: 'Verified 24/7 Hotlines' },
  'focus.audioBtn': { ar: '🔊 استمع', en: '🔊 Listen' },
  'focus.undoBtn': { ar: '↩️ تراجع شوط', en: '↩️ Undo Lap' },
  'focus.sosBtn': { ar: '🆘 أنا تائه', en: '🆘 SOS' },

  // Supervisor Mission Control Dashboard
  'sup.metric.activeGroup': { ar: 'الفوج النشط حالياً', en: 'Active Group' },
  'sup.metric.pilgrims': { ar: 'المعتمرون وكشف الحافلة', en: 'Pilgrims & Bus Boarding' },
  'sup.metric.collected': { ar: 'المحصل من باقات السداد', en: 'Installments Collected' },
  'sup.metric.sos': { ar: 'بلاغات التائهين النشطة', en: 'Active SOS Alerts' },
  'sup.board.title': { ar: '🗂️ لوحة إدارة الأفواج المتزامنة والمتتابعة', en: '🗂️ Multi-Group Operations Board' },
  'sup.board.pullBtn': { ar: '☁️ سحب من السحابة (D1)', en: '☁️ Pull from Cloud (D1)' },
  'sup.manifest.title': { ar: '🚌 كشف حضور باص الفوج النشط + روابط QR', en: '🚌 Bus Manifest & Pilgrim QR Links' },
  'sup.manifest.boardAll': { ar: '✅ تأكيد ركوب الجميع', en: '✅ Board All' },
  'sup.manifest.exportCsv': { ar: '📥 تصدير CSV', en: '📥 Export CSV' },
  'sup.rooming.title': { ar: '🏨 محرك تسكين الغرف (بضوابط الفصل والسعة)', en: '🏨 Rooming Engine (Gender & Capacity Guard)' },
  'sup.people.title': { ar: '👥 سجل الأشخاص الدائم عبر الرحلات (CRM)', en: '👥 Persistent Pilgrim Directory (CRM)' },
  'sup.gameya.title': { ar: '💰 خطط الأقساط المرنة والجمعية', en: '💰 Flexible Installments & Gam’eya Plans' },
  'sup.whatsapp.title': { ar: '💬 منشورات الواتساب المحدثة (7 مراحل)', en: '💬 WhatsApp Broadcast Hub (7 Phases)' },
  'sup.print.title': { ar: '🖨️ مركز الطباعة النظيفة وأكواد QR الحقيقية', en: '🖨️ Clean Print Center & Scannable QR' },
  'sup.sos.title': { ar: '🚨 غرفة متابعة بلاغات التائهين (GPS + خرائط)', en: '🚨 SOS Tracking Room (GPS & Maps)' },
  'sup.sos.pullBtn': { ar: '☁️ تحديث من D1', en: '☁️ Pull D1 Alerts' },
  'sup.women.title': { ar: '🧕 لوحة تنسيق شؤون الأخوات وزيارة الروضة الشريفة', en: '🧕 Women Affairs & Al-Rawdah Coordination' },
  'sup.luggage.title': { ar: '🧳 نظام فرز وتوصيل أمتعة الفوج (بعدادات حية)', en: '🧳 Group Luggage Sorting & QR Tags' },
  'sup.medical.title': { ar: '♿ السجل الطبي ورعاية كبار السن', en: '♿ Medical Care & Senior Mobility Registry' },
  'sup.col.passport': { ar: 'الجواز', en: 'Passport' },
  'sup.col.room': { ar: 'الغرفة', en: 'Room' },
  'sup.col.nusuk': { ar: 'نُسك', en: 'Nusuk' },
  'sup.col.bus': { ar: 'الباص', en: 'Bus' },
  'sup.col.actions': { ar: 'إجراءات', en: 'Actions' },
  'sup.col.phone': { ar: 'الهاتف', en: 'Phone' },
  'sup.col.health': { ar: 'الصحة', en: 'Health' },
  'sup.col.trips': { ar: 'الرحلات', en: 'Trips' },
  'sup.col.plan': { ar: 'الخطة', en: 'Plan' },
  'sup.col.total': { ar: 'الإجمالي والتقدم', en: 'Total & Progress' },
  'sup.col.paidRemaining': { ar: 'المسدد / المتبقي', en: 'Paid / Left' },
  'sup.col.nextDue': { ar: 'القادم والاستحقاق', en: 'Next Due' },
  'sup.col.status': { ar: 'الحالة', en: 'Status' },
  'sup.col.pilgrim': { ar: 'المعتمر', en: 'Pilgrim' },
  'sup.col.dueDate': { ar: 'الاستحقاق', en: 'Due Date' },
  'sup.col.dueAmount': { ar: 'المطلوب', en: 'Due' },
  'sup.col.paidAmount': { ar: 'المسدد', en: 'Paid' },
  'sup.col.pilgrimName': { ar: 'اسم المعتمر', en: 'Pilgrim Name' },
  'sup.col.name': { ar: 'الاسم', en: 'Name' },
  'sup.col.subscriber': { ar: 'المشترك', en: 'Subscriber' },
  'sup.col.bagCode': { ar: 'كود الحقيبة', en: 'Bag Code' },
  'sup.col.update': { ar: 'تحديث', en: 'Update' },
  'sup.btn.addPilgrim': { ar: '➕ إضافة معتمر', en: '➕ Add Pilgrim' },
  'sup.btn.openRoom': { ar: '➕ فتح غرفة', en: '➕ Open Room' },
  'sup.btn.assignRoom': { ar: '🏨 تسكين معتمر', en: '🏨 Assign Room' },
  'sup.btn.addPerson': { ar: '➕ إضافة شخص للسجل', en: '➕ Add Person' },
  'sup.btn.addMember': { ar: '➕ إضافة مشترك', en: '➕ Add Subscriber' },
  'sup.btn.printAgreement': { ar: '🖨️ طباعة إقرار سداد', en: '🖨️ Print Agreement' },
  'sup.btn.exportGameyaCsv': { ar: '📥 تصدير كشف الأقساط CSV', en: '📥 Export Installments CSV' },
  'sup.btn.addSos': { ar: '🆘 تسجيل بلاغ نشط', en: '🆘 Log Active SOS' },
  'sup.btn.addBag': { ar: '➕ إضافة حقيبة', en: '➕ Add Bag' },
  'sup.btn.printLuggage': { ar: '🖨️ طباعة بطاقات الأمتعة + QR', en: '🖨️ Print Bag QR Tags' },
  'sup.btn.addMed': { ar: '➕ إضافة حالة طبية', en: '➕ Add Medical Case' },
  'sup.filter.all': { ar: 'الكل', en: 'All' },
  'sup.filter.overdue': { ar: '⚠️ متأخر', en: '⚠️ Overdue' },
  'sup.filter.active': { ar: '⏳ قيد السداد', en: '⏳ Active' },
  'sup.filter.paid': { ar: '✅ مكتمل', en: '✅ Paid' },
  'sup.filter.rosca': { ar: '🔄 جمعية بالأدوار', en: '🔄 Rotating ROSCA' },
  'sup.search.manifest': { ar: 'بحث سريع في الكشف:', en: 'Quick Manifest Search:' },
  'sup.search.manifestPh': { ar: 'ابحث بالاسم أو الجواز أو رقم الغرفة...', en: 'Search by name, passport, or room...' },
  'sup.search.people': { ar: 'بحث في سجل الأشخاص:', en: 'Search People Directory:' },
  'sup.search.peoplePh': { ar: 'ابحث بالاسم، رقم الجواز، أو الهاتف...', en: 'Search by name, passport, or phone...' },
  'sup.search.gameyaPh': { ar: '🔍 ابحث باسم المشترك أو رقم الهاتف...', en: '🔍 Search by subscriber name or phone...' },
  'sup.badge.multiGroup': { ar: 'إدارة عدة أفواج معاً وتجهيز الفوج التالي', en: 'Manage concurrent groups & prepare the next trip' },
  'sup.badge.roomGuard': { ar: 'يمنع الخلط غير العائلي وتجاوز السعة', en: 'Prevents mixed non-family & over-capacity rooms' },
  'sup.badge.gamSummary': { ar: '6 خطط سداد + دفعات جزئية + سجل إيصالات', en: '6 plans + partial payments + verified receipts' },
  'sup.badge.waAuto': { ar: 'تترتب تلقائياً حسب مرحلة الفوج الحالية', en: 'Auto-ordered by active group stage' },
  'sup.link.visitorAtlas': { ar: '⛩️ دليل الحرمين والزوار (تطبيق المعتمر) ↗', en: '⛩️ Haramain Visitor Atlas (Pilgrim App) ↗' },
  'sup.link.womenFiqh': { ar: '📖 مرجع فقه المعتمرة الكامل ↗', en: "📖 Full Women's Fiqh Reference ↗" },
  'sup.popover.displaySec': { ar: 'العرض والأمان', en: 'Display & Security' },
  'sup.popover.syncSec': { ar: 'المزامنة والنسخ الاحتياطي', en: 'Cloud Sync & Backup' },
  'sup.popover.pinSetup': { ar: '🔒 تفعيل قفل الخصوصية (PIN)', en: '🔒 Set Privacy PIN Lock' },
  'sup.popover.pinLockNow': { ar: '🔐 قفل الشاشة الآن', en: '🔐 Lock Screen Now' },
  'sup.popover.exportJson': { ar: '💾 تصدير JSON', en: '💾 Export JSON' },
  'sup.popover.restoreJson': { ar: '📤 استعادة JSON', en: '📤 Restore JSON' },
  'sup.popover.resetDemo': { ar: '🔄 استعادة البيانات الافتراضية', en: '🔄 Reset Demo Data' },
  'sup.lug.total': { ar: 'الإجمالي', en: 'Total' },
  'sup.lug.bus': { ar: 'بالحافلة', en: 'On Bus' },
  'sup.lug.lobby': { ar: 'ببهو الاستقبال', en: 'Hotel Lobby' },
  'sup.lug.rooms': { ar: 'سُلّمت للغرف', en: 'Delivered' },
  'sup.sos.officialTitle': { ar: '🏛️ أرقام الطوارئ ومنصات المملكة الرسمية', en: '🏛️ Official Saudi Emergency & Nusuk Hotlines' },
  'tools.whatsappSheikh': { ar: '💬 واتساب الشيخ', en: '💬 WhatsApp Sheikh' },
  'sos.whatsappBtn': { ar: '💬 واتساب مباشر للشيخ', en: '💬 Direct WhatsApp' },
  'brand.zoomAvatarAria': {
    ar: 'تكبير صورة الشيخ مصطفى فليفل في المسجد النبوي',
    en: 'Zoom photo of Sheikh Mostafa Flefel at Masjid an-Nabawi',
  },
  'brand.openHubBtn': {
    ar: '✨ صفحة أبشروا والتواصل المباشر',
    en: '✨ Abshirou Hub & Direct Contact',
  },
};

let currentLang: UiLanguage = 'ar';

export function getCurrentLanguage(): UiLanguage {
  return currentLang;
}

export function t(key: string): string {
  const entry = DICTIONARY[key];
  if (!entry) return key;
  return entry[currentLang];
}

export function getDictionaryKeys(): string[] {
  return Object.keys(DICTIONARY);
}

export function getDictionaryEntry(key: string): { ar: string; en: string } | undefined {
  return DICTIONARY[key];
}

export function applyLanguage(lang: UiLanguage): void {
  currentLang = lang;
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';

  document.querySelectorAll<HTMLElement>('[data-i18n]').forEach((el) => {
    const key = el.dataset.i18n;
    if (key && DICTIONARY[key]) {
      el.textContent = DICTIONARY[key][lang];
    }
  });

  document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('[data-i18n-placeholder]').forEach((el) => {
    const key = el.dataset.i18nPlaceholder;
    if (key && DICTIONARY[key]) {
      el.placeholder = DICTIONARY[key][lang];
    }
  });

  document.querySelectorAll<HTMLElement>('[data-lang-toggle]').forEach((btn) => {
    btn.textContent = DICTIONARY['tools.lang'][lang];
    btn.setAttribute('aria-label', lang === 'ar' ? 'Switch interface to English' : 'التبديل إلى اللغة العربية');
  });

  try {
    localStorage.setItem(LANG_STORAGE_KEY, lang);
  } catch {
    // ignore storage restriction
  }
}

export function initLanguage(): UiLanguage {
  let saved: UiLanguage = 'ar';
  try {
    const raw = localStorage.getItem(LANG_STORAGE_KEY);
    if (raw === 'en' || raw === 'ar') saved = raw;
  } catch {
    saved = 'ar';
  }
  applyLanguage(saved);
  return saved;
}

export function toggleLanguage(): UiLanguage {
  const next: UiLanguage = currentLang === 'ar' ? 'en' : 'ar';
  applyLanguage(next);
  return next;
}
