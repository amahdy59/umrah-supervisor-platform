export enum CityLocation {
  MAKKAH = 'MAKKAH',
  MADINAH = 'MADINAH',
}

export interface PrayerTimes {
  fajr: string;
  sunrise: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
  source: string;
}

export interface NextPrayerInfo {
  nameAr: string;
  nameEn: string;
  prayerTime: string;
  minutesRemaining: number;
  matafWarning?: string;
}

const CITY_COORDS: Record<CityLocation, { name: string; lat: number; lng: number }> = {
  [CityLocation.MAKKAH]: {
    name: 'المسجد الحرام بمكة المكرمة',
    lat: 21.4225,
    lng: 39.8262,
  },
  [CityLocation.MADINAH]: {
    name: 'المسجد النبوي الشريف بالمدينة المنورة',
    lat: 24.4672,
    lng: 39.6112,
  },
};

function dtr(deg: number): number {
  return (deg * Math.PI) / 180;
}
function rtd(rad: number): number {
  return (rad * 180) / Math.PI;
}

/**
 * Extracts year, month, day, hour, minute in Asia/Riyadh (UTC+3)
 * regardless of the device's local timezone.
 */
export function getRiyadhParts(date: Date = new Date()): {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
} {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Riyadh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });
  const parts = formatter.formatToParts(date);
  const map: Record<string, string> = {};
  for (const p of parts) {
    map[p.type] = p.value;
  }
  return {
    year: Number(map.year),
    month: Number(map.month),
    day: Number(map.day),
    hour: Number(map.hour === '24' ? '0' : map.hour),
    minute: Number(map.minute),
  };
}

function julianDay(year: number, month: number, day: number): number {
  if (month <= 2) {
    year -= 1;
    month += 12;
  }
  const A = Math.floor(year / 100);
  const B = 2 - A + Math.floor(A / 4);
  return Math.floor(365.25 * (year + 4716)) + Math.floor(30.6001 * (month + 1)) + day + B - 1524.5;
}

function sunPosition(jd: number): { decl: number; eqt: number } {
  const D = jd - 2451545.0;
  const g = (357.529 + 0.98560028 * D) % 360;
  const q = (280.459 + 0.98564736 * D) % 360;
  const L = (q + 1.915 * Math.sin(dtr(g)) + 0.02 * Math.sin(dtr(2 * g))) % 360;
  const e = 23.439 - 0.00000036 * D;
  const RA = rtd(Math.atan2(Math.cos(dtr(e)) * Math.sin(dtr(L)), Math.cos(dtr(L)))) / 15;
  const eqt = q / 15 - (((RA % 24) + 24) % 24);
  const decl = rtd(Math.asin(Math.sin(dtr(e)) * Math.sin(dtr(L))));
  return { decl, eqt };
}

function sunAngleTime(jd: number, lat: number, angle: number, ccw: boolean): number {
  const { decl, eqt } = sunPosition(jd);
  const noon = 12 - eqt;
  const num = -Math.sin(dtr(angle)) - Math.sin(dtr(lat)) * Math.sin(dtr(decl));
  const den = Math.cos(dtr(lat)) * Math.cos(dtr(decl));
  const ratio = Math.max(-1, Math.min(1, num / den));
  const t = rtd(Math.acos(ratio)) / 15;
  return noon + (ccw ? -t : t);
}

function asrTime(jd: number, lat: number): number {
  const { decl, eqt } = sunPosition(jd);
  const noon = 12 - eqt;
  const target = -rtd(Math.atan(1 / (1 + Math.tan(dtr(Math.abs(lat - decl))))));
  const num = -Math.sin(dtr(target)) - Math.sin(dtr(lat)) * Math.sin(dtr(decl));
  const den = Math.cos(dtr(lat)) * Math.cos(dtr(decl));
  const ratio = Math.max(-1, Math.min(1, num / den));
  const t = rtd(Math.acos(ratio)) / 15;
  return noon + t;
}

function formatHours(hours: number): string {
  const totalMinutes = Math.round((((hours % 24) + 24) % 24) * 60);
  const h = Math.floor(totalMinutes / 60) % 24;
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export class PrayerTimesEngine {
  /**
   * Computes seasonal prayer times for Makkah or Madinah in Asia/Riyadh (UTC+3)
   * following Umm Al-Qura conventions (Fajr 18.5°, Isha +90 mins after Maghrib).
   */
  getPrayerTimes(city: CityLocation = CityLocation.MAKKAH, date: Date = new Date()): PrayerTimes {
    const coords = CITY_COORDS[city];
    const riyadh = getRiyadhParts(date);
    const jd = julianDay(riyadh.year, riyadh.month, riyadh.day);
    const tzOffset = 3; // Asia/Riyadh UTC+3
    const baseOffset = tzOffset - coords.lng / 15;

    const { eqt } = sunPosition(jd);
    const dhuhrH = 12 - eqt + baseOffset;
    const fajrH = sunAngleTime(jd, coords.lat, 18.5, true) + baseOffset;
    const sunriseH = sunAngleTime(jd, coords.lat, 0.833, true) + baseOffset;
    const asrH = asrTime(jd, coords.lat) + baseOffset;
    const maghribH = sunAngleTime(jd, coords.lat, 0.833, false) + baseOffset;
    const ishaH = maghribH + 1.5; // Umm Al-Qura: 90 minutes after Maghrib (120 min in Ramadan)

    return {
      fajr: formatHours(fajrH),
      sunrise: formatHours(sunriseH),
      dhuhr: formatHours(dhuhrH),
      asr: formatHours(asrH),
      maghrib: formatHours(maghribH),
      isha: formatHours(ishaH),
      source: 'حساب فلكي بتوقيت مكة (تقويم أم القرى - UTC+3)',
    };
  }

  getNextPrayer(city: CityLocation = CityLocation.MAKKAH, currentTime: Date = new Date()): NextPrayerInfo {
    const times = this.getPrayerTimes(city, currentTime);
    const riyadh = getRiyadhParts(currentTime);
    const currentMins = riyadh.hour * 60 + riyadh.minute;

    const prayers = [
      { key: 'fajr', nameAr: 'الفجر', nameEn: 'Fajr', timeStr: times.fajr },
      { key: 'sunrise', nameAr: 'الشروق', nameEn: 'Sunrise', timeStr: times.sunrise },
      { key: 'dhuhr', nameAr: 'الظهر', nameEn: 'Dhuhr', timeStr: times.dhuhr },
      { key: 'asr', nameAr: 'العصر', nameEn: 'Asr', timeStr: times.asr },
      { key: 'maghrib', nameAr: 'المغرب', nameEn: 'Maghrib', timeStr: times.maghrib },
      { key: 'isha', nameAr: 'العشاء', nameEn: 'Isha', timeStr: times.isha },
    ];

    for (const p of prayers) {
      const [h, m] = p.timeStr.split(':').map(Number);
      const prayerMins = h * 60 + m;

      if (prayerMins > currentMins) {
        const diffMins = prayerMins - currentMins;
        let matafWarning: string | undefined;

        if (city === CityLocation.MAKKAH && diffMins <= 25 && p.key !== 'sunrise') {
          matafWarning = `تنبيه هام: متبقي ${diffMins} دقيقة على أذان ${p.nameAr} (بتوقيت مكة). تبدأ قوات أمن الحرمين في إخلاء صحن المطاف للمصلين فقط ومنع دخول الطائفين مؤقتاً لحين انتهاء صلاة الفريضة.`;
        }

        return {
          nameAr: p.nameAr,
          nameEn: p.nameEn,
          prayerTime: p.timeStr,
          minutesRemaining: diffMins,
          matafWarning,
        };
      }
    }

    const tomorrow = new Date(currentTime.getTime() + 24 * 60 * 60 * 1000);
    const tomorrowTimes = this.getPrayerTimes(city, tomorrow);
    const [fh, fm] = tomorrowTimes.fajr.split(':').map(Number);
    const tomorrowFajrMins = 24 * 60 + (fh * 60 + fm);
    const diffMins = tomorrowFajrMins - currentMins;

    return {
      nameAr: 'الفجر',
      nameEn: 'Fajr',
      prayerTime: tomorrowTimes.fajr,
      minutesRemaining: diffMins,
    };
  }
}
