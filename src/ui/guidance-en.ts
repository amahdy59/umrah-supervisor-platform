import { TripStatus } from '../operations/trip-logistics.js';

export const TRIP_STAGE_LABELS_EN: Record<TripStatus, string> = {
  [TripStatus.DRAFT]: 'Draft Setup',
  [TripStatus.REGISTRATION_OPEN]: 'Registration Open',
  [TripStatus.PRE_DEPARTURE]: 'Pre-Departure Prep',
  [TripStatus.IN_TRANSIT]: 'En Route / Miqat',
  [TripStatus.IN_MAKKAH]: 'In Makkah Al-Mukarramah',
  [TripStatus.IN_MADINAH]: 'In Al-Madinah Al-Munawwarah',
  [TripStatus.RETURN_TRANSIT]: 'Return Departure Prep',
  [TripStatus.COMPLETED]: 'Completed (Archived)',
};

export interface AtlasEnEntry {
  directionEn: string;
  areaEn: string;
  summaryEn: string;
  benefitsEn: string[];
  hotelAccessNoteEn?: string;
}

export const HARAM_ATLAS_EN: Record<string, AtlasEnEntry> = {
  KAABA_DOOR_MULTAZAM: {
    directionEn: 'Eastern Face of the Holy Kaaba',
    areaEn: 'Mataf courtyard in front of Maqam Ibrahim',
    summaryEn:
      'The golden Door of the Kaaba sits on the eastern wall. Between the Black Stone and the door lies Al-Multazam where supplication is recommended when uncrowded, facing Maqam Ibrahim where two Sunnah rak’ahs are prayed after Tawaf.',
    benefitsEn: [
      'Pray two Sunnah rak’ahs after Tawaf behind Maqam Ibrahim anywhere along that alignment in the Mataf or upper floors.',
      'Chilled Zamzam dispensers are stationed around the perimeter of the Mataf and after prayer areas.',
      'Clear illuminated markers indicate the Black Stone starting line for each Tawaf circuit.',
    ],
  },
  KAABA_COURTYARD_HIJR: {
    directionEn: 'Center of Masjid al-Haram around the Kaaba',
    areaEn: 'Ground Mataf & Upper Circumambulation Floors',
    summaryEn:
      'Hijr Ismail (Al-Hatim) is part of the original Kaaba foundation, so every Tawaf circuit must pass completely outside its semicircular wall. Between the Yamani Corner and Black Stone recite: Rabbana atina fid-dunya hasanah...',
    benefitsEn: [
      'The ground Mataf is primarily reserved for muhrims in Ihram garments; shaded air-conditioned upper decks suit families and seniors.',
      'Red Crescent medical rapid-response teams monitor the Mataf continuously.',
      'Free manual wheelchairs and electric cart decks are available on the 1st and 2nd floors.',
    ],
  },
  SAFA_MARWAH_MASA: {
    directionEn: 'Eastern Gallery of Masjid al-Haram',
    areaEn: 'Sa’i starts at Mount Safa and ends at Mount Marwah',
    summaryEn:
      'Al-Masaa spans multiple air-conditioned levels served by escalators and elevators. Green overhead lights mark the section where brisk walking (herwala) is Sunnah for men only; women walk calmly throughout.',
    benefitsEn: [
      'Dedicated barrier-separated lane for wheelchairs and electric carts on designated floors.',
      'Chilled Zamzam water stations and rest benches lined along both sides of the gallery.',
      'Quick exits right after lap 7 at Marwah toward Bab Al-Fath (Gate 45) & Al-Ghazza.',
    ],
  },
  GATE_KING_ABDULAZIZ_1: {
    directionEn: 'Southern Plaza (Facing Clock Tower)',
    areaEn: 'Ajyad / Abraj Al Bait Endowment',
    summaryEn:
      'The iconic main southern gate across from Abraj Al Bait (Clock Tower), providing direct access to the ground Mataf and Ajyad hotels.',
    benefitsEn: [
      'Complimentary manual wheelchair pickup points across the Southern Plaza.',
      'High-capacity escalators and lifts leading to the upper Mataf and rooftop.',
      'Lost-pilgrim guidance desks and a 24/7 first-aid clinic near the plaza entrances.',
    ],
    hotelAccessNoteEn: 'Closest gate for Abraj Al Bait (Clock Tower) and Ajyad hotels (2-min walk).',
  },
  GATE_KING_FAHD_79: {
    directionEn: 'Western Plaza (Jabal Omar / Al-Taysir)',
    areaEn: 'Western Courtyard & Jarwal Tunnels',
    summaryEn:
      'Monumental western gate in the King Fahd Expansion with rapid escalators to the upper decks and calm routes away from Ajyad bottlenecks.',
    benefitsEn: [
      'Free shuttle bus bays and wide shaded gathering plazas.',
      'Organized shoe/baggage lockers and nearby subterranean ablution halls.',
      'Senior wheelchair assistance desks right at the western plaza threshold.',
    ],
    hotelAccessNoteEn: 'Ideal exit for Al Kiswah Towers, Jarwal, Al-Taysir & Dar Al Tawhid via Jarwal tunnels or shuttle.',
  },
  GATE_KING_ABDULLAH_100: {
    directionEn: 'Northern Plaza (3rd Saudi Expansion)',
    areaEn: 'Northern Courtyards / Al-Ghazza / Jarwal',
    summaryEn:
      'The largest northern portal of the Third Saudi Expansion, featuring ultra-cooled expansive prayer halls, mist fans, and direct tour bus staging.',
    benefitsEn: [
      'High-capacity chilled air-conditioning inside and misting cooling fans outside.',
      'Free luggage/shoe lockers outside the plaza and modern multi-level washrooms.',
      'Fatwa guidance booths, complimentary Quran distribution, and large elevators.',
    ],
    hotelAccessNoteEn: 'Best gate for charter coaches serving Al-Taysir, Al-Ghazza & 1st Ring Road hotels.',
  },
  GATE_UMRAH_62: {
    directionEn: 'North-Western Plaza',
    areaEn: 'Al-Shubaikah / Jabal Omar / Ibrahim Al Khalil St.',
    summaryEn:
      'Historic north-western gate opening smoothly into the Mataf; the primary gateway for Jabal Omar, Hilton Makkah, and Al-Shubaikah hotels.',
    benefitsEn: [
      'Major staging desk for manual and electric senior carts.',
      'Direct sightline toward Hijr Ismail and the Syrian/Yamani corners.',
      'Accessible restrooms and ablution facilities right beside Al-Shubaikah plaza.',
    ],
    hotelAccessNoteEn: 'Closest gate for Jabal Omar, Hilton Makkah & Ibrahim Al Khalil St. (~5-min walk).',
  },
  GATE_AL_FATH_45: {
    directionEn: 'North-Eastern Plaza',
    areaEn: 'Al-Ghazza / Marwah Exit / Sha’b Ali',
    summaryEn:
      'Primary north-eastern gateway beside Mount Marwah, heavily used upon finishing the 7th lap of Sa’i to proceed directly to authorized barbers.',
    benefitsEn: [
      'Direct access to licensed barber shops and washrooms at Marwah / Al-Ghazza.',
      'Practical group regrouping landmark after completing Umrah rituals.',
      'Shaded walkways leading directly toward Al-Ghazza and Rea Bakhash bus stops.',
    ],
    hotelAccessNoteEn: 'Recommended for guests staying in Al-Ghazza, Rea Bakhash & Sha’b Amir.',
  },
  NABAWI_BAB_SALAM_1: {
    directionEn: 'South-Western Side (Greeting Route)',
    areaEn: 'Processional corridor to Al-Rawdah & the Sacred Chamber',
    summaryEn:
      'The historic gate through which men enter calmly with lowered voices to offer salam upon the Prophet ﷺ and his Companions Abu Bakr and Umar (RA).',
    benefitsEn: [
      'Calm, structured one-way flow preventing crowding before the Noble Chamber.',
      'Trained guides and wheelchair helpers assisting seniors throughout the corridor.',
      'Natural exit toward Al-Baqi Cemetery and the eastern umbrella plaza.',
    ],
    hotelAccessNoteEn: 'Convenient for southern and western Central Area Madinah hotels.',
  },
  NABAWI_RAWDAH_GREEN_DOME: {
    directionEn: 'Heart of Al-Masjid an-Nabawi between the Chamber & Minbar',
    areaEn: 'Timed entry via Nusuk permit (Southern/Eastern plazas)',
    summaryEn:
      '“Between my house and my pulpit lies a garden from the gardens of Paradise” (Agreed Upon). Entry is scheduled via the Nusuk app for serene prayer.',
    benefitsEn: [
      'Watch for “Instant Track” slots inside the Nusuk app while connected within the Mosque plaza GPS zone.',
      'Separate dedicated male and female visiting schedules ensure privacy and tranquility.',
      'Allows peaceful two-rak’ah prayer and dua without pushing.',
    ],
  },
  NABAWI_BAB_UTHMAN_25: {
    directionEn: 'Northern & Eastern Women’s Plazas',
    areaEn: 'Women’s prayer halls & Nusuk Rawdah staging (Gates 24–26 / 32 / 37)',
    summaryEn:
      'Primary northern/eastern gate complex guiding female pilgrims to women’s prayer halls and organized Rawdah permit queues.',
    benefitsEn: [
      'Shaded, cooled women’s staging areas with staff organizing Rawdah permit slots.',
      'Free wheelchairs for elderly sisters from the northern plaza entrance into the prayer halls.',
      'Women-only Quran recitation correction circles and female scholars’ guidance desks.',
    ],
    hotelAccessNoteEn: 'Ideal for northern Central Area hotels (Gates 21 King Fahd & 25 Uthman).',
  },
  NABAWI_COURTYARD_UMBRELLAS: {
    directionEn: 'Plazas surrounding the Prophet’s Mosque & Al-Baqi East',
    areaEn: '250 Giant Shading Canopies & Subterranean Facilities',
    summaryEn:
      'Features 250 giant automated umbrellas equipped with cooling mist fans, escalator towers to vast underground ablution halls, and the eastern path to Al-Baqi.',
    benefitsEn: [
      'Chilled Zamzam water stations spaced along all shaded outer courtyards.',
      'Direct access to Al-Baqi Cemetery gates (open after Fajr and Asr for men).',
      'Courtyard golf carts ferrying elderly visitors between outer plazas and hotel edges.',
    ],
  },
};

export interface BenefitEnEntry {
  titleEn: string;
  categoryEn: string;
  whereToFindEn: string;
  howToBenefitEn: string;
}

export const HARAM_BENEFITS_EN: Record<string, BenefitEnEntry> = {
  ZAMZAM_STATIONS: {
    titleEn: 'Chilled & Room-Temp Zamzam Water Stations on Every Level',
    categoryEn: 'Free Service',
    whereToFindEn: 'At every gate entrance, around the Mataf, throughout Al-Masaa, and Madinah courtyards',
    howToBenefitEn:
      'Drink deeply with sincere intention; wood-toned containers hold non-chilled Zamzam ideal for seniors and sensitive throats.',
  },
  WHEELCHAIRS_AND_CARTS: {
    titleEn: 'Complimentary Manual Wheelchairs & Official Electric Golf Carts',
    categoryEn: 'Senior Accessibility',
    whereToFindEn: 'Gates 1, 62, 79, Marwah plaza (Makkah) & Madinah plazas (via Nusuk)',
    howToBenefitEn:
      'Book electric carts officially inside Nusuk (Services → Transport) or borrow a free manual chair with ID from official desks.',
  },
  QURAN_AND_IFTA: {
    titleEn: 'Free Quran Correction Circles, Fatwa Desks & Live Translation',
    categoryEn: 'Spiritual Benefits',
    whereToFindEn: 'Quran racks by every column & Official Guidance booths around Mataf and Rawdah',
    howToBenefitEn:
      'Verify Surah Al-Fatihah recitation with certified teachers and ask accredited scholars any ritual question on the spot.',
  },
  PRAYER_MULTIPLICATION: {
    titleEn: 'Multiplied Prayer Rewards & Funeral (Janazah) Prayer',
    categoryEn: 'Spiritual Benefits',
    whereToFindEn: 'Anywhere inside Masjid al-Haram (100,000×) & Masjid an-Nabawi (1,000×)',
    howToBenefitEn:
      'All expansions share in the multiplied reward; stay a few minutes after Fard prayers to join Janazah prayers (1 Qirat reward like Mount Uhud).',
  },
  LOCKERS_LOST_MEDICAL: {
    titleEn: 'Baggage Lockers, Lost-Found Centers & 24/7 Red Crescent Clinics',
    categoryEn: 'Safety & Organization',
    whereToFindEn: 'Outer plazas (especially Northern Expansion Gate 100, Ajyad & Bab Al-Salam)',
    howToBenefitEn:
      'Large suitcases aren’t allowed inside the Mataf or Rawdah; store them free in outer lockers and seek free clinic aid immediately upon dizziness.',
  },
  ELEVATORS_AC_BASEMENTS: {
    titleEn: 'Subterranean Ablution Halls, Escalators & Calm Upper Levels',
    categoryEn: 'Senior Accessibility',
    whereToFindEn: 'Beneath outer courtyards in both cities & elevator banks to upper decks',
    howToBenefitEn:
      'Air-conditioned upper floors and the rooftop at night offer uncrowded Tawaf with accessible seating and senior ablution chairs downstairs.',
  },
};

export interface ZiyaratEnEntry {
  virtueEn: string;
  etiquetteEn: string;
  warningsEn?: string;
  timesEn?: string;
}

export const ZIYARAT_SITES_EN: Record<string, ZiyaratEnEntry> = {
  MASJID_QUBA: {
    virtueEn:
      'First mosque founded upon piety in Islam; performing ablution at one’s residence and praying two rak’ahs there carries the reward of an Umrah (Sahih Hadith).',
    etiquetteEn:
      'Perform wudu at the hotel before departing, pray two rak’ahs calmly inside, or walk the pleasant ~3 km Darb Al-Sunnah pedestrian path from Masjid an-Nabawi.',
    timesEn: 'The Prophet ﷺ visited Quba every Saturday; morning (Duha) hours are mildest.',
  },
  MOUNT_UHUD: {
    virtueEn:
      '“Uhud is a mountain that loves us and we love it” (Agreed Upon). Site of the Battle of Uhud and resting place of 70 Companions led by Hamzah ibn Abdul-Muttalib (RA).',
    etiquetteEn:
      'For men, offer peace upon the martyrs outside the cemetery with the authentic Sunnah greeting: “As-salamu alaykum ahlad-diyari minal-mu’minin…” (Sahih Muslim).',
    warningsEn: 'Avoid bid’ah: never rub rocks or cemetery soil for blessing, avoid tossing money, and supplicate to Allah alone.',
    timesEn: 'Early morning or late afternoon before sunset to avoid midday heat.',
  },
  MASJID_QIBLATAYN: {
    virtueEn:
      'Historic mosque where revelation descended commanding the Qiblah change from Jerusalem toward the Holy Kaaba in Makkah (Quran 2:144).',
    etiquetteEn: 'Pray two rak’ahs tahiyyat al-masjid and reflect on the Ummah’s devotion and obedience to revelation.',
  },
  AL_BAQI_CEMETERY: {
    virtueEn:
      'Resting place of thousands of Companions, the Prophet’s wives and daughters, adjacent to the eastern plaza of Al-Masjid an-Nabawi.',
    etiquetteEn: 'Stand respectfully at the perimeter (or enter during male visiting hours) reciting the Prophetic greeting for the deceased and praying for their mercy.',
    warningsEn: 'Do not wipe hands on fences or seek fulfillment of needs from the graves.',
    timesEn: 'Usually opens for male visitors shortly after Fajr and Asr prayers.',
  },
  JABAL_AL_NUR: {
    virtueEn:
      'Contains Cave Hira where Angel Jibril first revealed Surah Al-Alaq (“Read in the name of your Lord Who created”) to Prophet Muhammad ﷺ.',
    etiquetteEn: 'View the mountain respectfully and visit the nearby Hira Cultural District exhibition. Climbing is strenuous and NOT part of Umrah; seniors should refrain.',
    warningsEn: 'Avoid carving graffiti on rocks, littering, or treating cave stones as blessed relics.',
  },
  JABAL_THAWR: {
    virtueEn:
      'Mountain cave sheltering the Prophet ﷺ and Abu Bakr Al-Siddiq (RA) during the Hijrah migration: “Do not grieve; indeed Allah is with us” (9:40).',
    etiquetteEn: 'Reflect upon reliance on Allah (Tawakkul) alongside careful planning.',
    warningsEn: 'Steep climb unrelated to Umrah rites; avoid touching stones for blessing or praying toward the cave.',
  },
  HOLY_SITES_MINA_ARAFAT: {
    virtueEn: 'Sacred Hajj plains housing Jabal al-Rahmah and Namirah Mosque at Arafat, Muzdalifah, and Jamarat at Mina.',
    etiquetteEn: 'Observe the Hajj landmarks and supplicate sincerely that Allah grants every pilgrim an accepted Hajj.',
  },
};

export interface GateEnEntry {
  nearestAreaEn: string;
  descriptionEn: string;
  howToReachEn: string;
  avoidWarningEn?: string;
}

export const HARAM_GATES_EN: Record<number, GateEnEntry> = {
  79: {
    nearestAreaEn: 'Jarwal / Al-Taysir / Al-Shubaikah',
    descriptionEn: 'Primary western gate best suited for guests at Al Kiswah Towers, Jarwal, and Al-Taysir to bypass Ajyad crowds.',
    howToReachEn: 'Exit Gate 79 toward the western plaza and pedestrian tunnels to Jarwal / Al-Taysir (12–15 min walk or free shuttle bus).',
    avoidWarningEn: 'Avoid exiting via Gate 1 (King Abdulaziz) which puts you south at Ajyad — a ~3 km detour around the Haram back to Jarwal.',
  },
  100: {
    nearestAreaEn: 'Jarwal / Al-Ghazza / Sulaymaniyah',
    descriptionEn: 'Spacious northern gate in the 3rd Expansion opening straight to tour bus bays toward Jarwal and Al-Ghazza.',
    howToReachEn: 'Exit to the northern plaza; bear left toward Jarwal/Al-Taysir tunnels or right toward Al-Ghazza.',
  },
  1: {
    nearestAreaEn: 'Ajyad / Abraj Al Bait (Clock Tower)',
    descriptionEn: 'Main southern landmark portal directly across from the Clock Tower complex and Ajyad Street.',
    howToReachEn: 'Leads straight onto the southern plaza facing Abraj Al Bait and Ajyad Street (2-minute walk).',
  },
  45: {
    nearestAreaEn: 'Sha’b Ali / Marwah / Al-Ghazza / Rea Bakhash',
    descriptionEn: 'North-eastern gate right beside Mount Marwah — fastest exit after finishing the 7th lap of Sa’i.',
    howToReachEn: 'After finishing Sa’i at Marwah, exit via Gate 45 or Marwah doors directly onto Al-Ghazza & Al-Muda’a plaza.',
  },
  62: {
    nearestAreaEn: 'Al-Shubaikah / Jabal Omar / Ibrahim Al Khalil St.',
    descriptionEn: 'Historic north-western gateway leading cleanly to Al-Shubaikah, Jabal Omar, and Hilton Makkah (beside doors 63–64).',
    howToReachEn: 'Exit Gate 62 across Al-Shubaikah plaza directly toward Jabal Omar escalators and Ibrahim Al Khalil St. (~5-min walk).',
  },
};

export const MIQAT_ROUTES_EN: Record<string, { routeEn: string; miqatEn: string; timingEn: string }> = {
  'flight-jeddah': {
    routeEn: '✈️ Direct Flight to Jeddah (from Egypt / Levant / Europe)',
    miqatEn: 'Al-Juhfah (Rabigh) Aerial Alignment',
    timingEn:
      'Airline crew announce alignment ~20–30 minutes ahead. Wear Ihram garments before boarding at departure to avoid tight cabin washrooms, then state Niyyah and Talbiyah at announcement.',
  },
  'flight-madinah': {
    routeEn: '🕌 Arriving in Madinah First, Then Heading to Makkah',
    miqatEn: 'Miqat Dhul-Hulayfah (Abyar Ali)',
    timingEn:
      'No Ihram needed on the flight to Madinah. Bathe and dress in Ihram at your Madinah hotel, then enter Ihram and recite Talbiyah at the Abyar Ali Miqat Mosque on the highway.',
  },
  'haramain-train-makkah': {
    routeEn: '🚄 Haramain High-Speed Train (Madinah → Makkah)',
    miqatEn: 'Dhul-Hulayfah Boundary as Train Departs',
    timingEn:
      'The high-speed train does NOT stop at Abyar Ali; dress in Ihram at your hotel and make Niyyah & Talbiyah right as the train leaves Madinah station.',
  },
  'taneem-makkah': {
    routeEn: '🚌 Additional Umrah While Inside Makkah',
    miqatEn: 'Masjid Aisha at Al-Tan’eem',
    timingEn:
      'Located ~7–8 km north of Masjid al-Haram. Scholars note multiplying voluntary Tawaf inside the Haram can often hold greater virtue than repeated trips outside during the same visit.',
  },
};

export const OFFICIAL_RESOURCES_EN: Record<string, { titleEn: string; summaryEn: string; actionEn: string }> = {
  'nusuk-app': {
    titleEn: 'Nusuk Platform & Mobile App',
    summaryEn: 'Official booking portal for Umrah & Rawdah permits (including GPS Instant Track) and electric Haramain carts.',
    actionEn: 'Open Official Nusuk Site',
  },
  'emergency-911': {
    titleEn: 'Unified Security & Emergency (911)',
    summaryEn: 'Unified 24/7 emergency hotline across Makkah & Madinah regions for urgent assistance.',
    actionEn: 'Call 911',
  },
  'ambulance-997': {
    titleEn: 'Saudi Red Crescent Ambulance (997)',
    summaryEn: 'Medical emergencies, heat exhaustion or fainting; give dispatch the nearest Haram gate or pillar number.',
    actionEn: 'Call 997',
  },
  'moh-937': {
    titleEn: 'Ministry of Health Helpline (937)',
    summaryEn: 'Free 24/7 multilingual medical consultations and nearest clinic/hospital locator.',
    actionEn: 'Call 937',
  },
  'hajj-1966': {
    titleEn: 'Ministry of Hajj Pilgrim Care (1966)',
    summaryEn: 'Official pilgrim helpline (1966 on Saudi SIMs, or +966920002814 on roaming/international SIMs).',
    actionEn: 'Call +966 92 000 2814',
  },
  'haramain-train': {
    titleEn: 'Haramain High-Speed Railway (HHR)',
    summaryEn: 'Fast rail link connecting Jeddah, Makkah & Madinah (~2h 15m). Observe baggage limits (1 large + 1 carry-on).',
    actionEn: 'Book Haramain Train',
  },
  'makkah-bus': {
    titleEn: 'Makkah Public Transit Buses',
    summaryEn: 'Air-conditioned buses linking main districts, Tan’eem Mosque & train station (~4 SAR fare).',
    actionEn: 'Open Makkah Bus',
  },
};

export const FIELD_GUIDES_EN: Record<string, { titleEn: string; adviceEn: string; sourceEn: string }> = {
  FOOTWEAR_SHOE_BAG: {
    titleEn: 'Footwear Bag & Keeping Shoes With You',
    adviceEn: 'Always carry a lightweight cloth shoe bag inside your backpack. Never leave shoes loose in hallways or gates so cleaning crews do not remove them.',
    sourceEn: 'Presidency of Religious Affairs of the Two Holy Mosques',
  },
  HEATSTROKE_HYDRATION: {
    titleEn: 'Heat Prevention & Regular Zamzam Hydration',
    adviceEn: 'Drink chilled or room-temp Zamzam frequently, carry a light umbrella, and seniors should perform Tawaf/Sa’i indoors or at night away from peak noon heat (11:30–15:30).',
    sourceEn: 'Saudi Ministry of Health (937)',
  },
  EMERGENCY_CORRIDORS: {
    titleEn: 'Keep Emergency Corridors Clear',
    adviceEn: 'Never pray or sit in pedestrian walkways, escalator landings, or Red Crescent lanes. Move steadily with the flow in crowded spots without sudden stops.',
    sourceEn: 'Haram Security Forces (911)',
  },
  NUSUK_RAWDAH_PERMITS: {
    titleEn: 'Nusuk App Permits for Al-Rawdah Ash-Sharifah',
    adviceEn: 'Rawdah entry requires an active Nusuk permit. Arrive 15–30 min early at your assigned gate (e.g., Bab Uthman 25 / routes 32–37 for women, Bab Al-Salam for men) with a clear screenshot backup.',
    sourceEn: 'Ministry of Hajj & Umrah (Nusuk)',
  },
  OFFICIAL_WHEELCHAIR_BOOKING: {
    titleEn: 'Official Electric Carts & Manual Wheelchairs',
    adviceEn: 'Book electric golf carts in the Nusuk app (Services → Transport) or obtain free manual wheelchairs from official desks on upper decks; avoid unlicensed middlemen.',
    sourceEn: 'General Authority for the Care of Al-Haramain',
  },
  ZAMZAM_AIRPORT_RULES: {
    titleEn: '5-Liter Airport Zamzam Bottle Rules',
    adviceEn: 'Each pilgrim may check ONE officially sealed 5L King Abdullah Zamzam bottle purchased at official Jeddah/Madinah airport kiosks (~12 SAR). Loose bottles inside luggage are prohibited.',
    sourceEn: 'GACA Aviation Authority',
  },
  LOST_PILGRIM_PROTOCOL: {
    titleEn: 'What To Do If Separated Inside Al-Haramain',
    adviceEn: 'Stop wandering aimlessly; stand safely beside the nearest numbered gate or labeled pillar, show your hotel card to security staff, and share GPS via WhatsApp with your supervisor.',
    sourceEn: 'Haram Security Forces',
  },
};

export function bearingDirectionLabel(deg: number, isEn: boolean): string {
  const dirsAr = ['شمال ⬆️', 'شمال شرق ↗️', 'شرق ➡️', 'جنوب شرق ↘️', 'جنوب ⬇️', 'جنوب غرب ↙️', 'غرب ⬅️', 'شمال غرب ↖️'];
  const dirsEn = ['North ⬆️', 'Northeast ↗️', 'East ➡️', 'Southeast ↘️', 'South ⬇️', 'Southwest ↙️', 'West ⬅️', 'Northwest ↖️'];
  const idx = Math.round(((deg % 360) / 45)) % 8;
  return (isEn ? dirsEn : dirsAr)[idx] || (isEn ? 'North ⬆️' : 'شمال ⬆️');
}
