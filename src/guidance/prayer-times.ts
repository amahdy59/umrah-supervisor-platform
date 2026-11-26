export enum CityLocation {
  MAKKAH = 'MAKKAH',
  MADINAH = 'MADINAH',
}

export type PrayerKey = 'fajr' | 'sunrise' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';

export interface PrayerTimes {
  fajr: string;
  sunrise: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
  isRamadan: boolean;
  ishaOffsetMinutes: 90 | 120;
  source: string;
}

export interface NextPrayerInfo {
  nameAr: string;
  nameEn: string;
  prayerTime: string;
  minutesRemaining: number;
  matafWarning?: string;
}

export interface PrayerCardState {
  key: PrayerKey;
  nameAr: string;
  nameEn: string;
  timeStr: string;
  status: 'passed' | 'active' | 'upcoming';
  isTomorrow: boolean;
  minutesUntil: number;
  progressPercent: number;
}

export interface PrayerScheduleState {
  times: PrayerTimes;
  next: NextPrayerInfo & {
    key: PrayerKey;
    secondsRemaining: number;
    isTomorrow: boolean;
    progressPercent: number;
  };
  cards: PrayerCardState[];
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
 * Extracts year, month, day, hour, minute, second in Asia/Riyadh (UTC+3)
 * regardless of the device's local timezone.
 */
export function getRiyadhParts(date: Date = new Date()): {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
} {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Riyadh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
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
    second: Number(map.second || '0'),
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

export function isUmmAlQuraRamadan(date: Date = new Date()): boolean {
  try {
    const fmt = new Intl.DateTimeFormat('en-US-u-ca-islamic-umalqura', {
      timeZone: 'Asia/Riyadh',
      month: 'numeric',
    });
    const monthNum = Number(fmt.format(date).replace(/[^\d]/g, ''));
    return monthNum === 9;
  } catch {
    return false;
  }
}

export class PrayerTimesEngine {
  /**
   * Computes seasonal prayer times for Makkah or Madinah in Asia/Riyadh (UTC+3)
   * following Umm Al-Qura conventions (Fajr 18.5°, Isha +90 mins after Maghrib,
   * automatically expanding to +120 mins during Umm Al-Qura Ramadan month 9).
   */
  getPrayerTimes(city: CityLocation = CityLocation.MAKKAH, date: Date = new Date()): PrayerTimes {
    const coords = CITY_COORDS[city];
    const riyadh = getRiyadhParts(date);
    const jd = julianDay(riyadh.year, riyadh.month, riyadh.day);
    const tzOffset = 3; // Asia/Riyadh UTC+3
    const baseOffset = tzOffset - coords.lng / 15;
    const isRamadan = isUmmAlQuraRamadan(date);
    const ishaOffsetMinutes: 90 | 120 = isRamadan ? 120 : 90;

    const { eqt } = sunPosition(jd);
    const dhuhrH = 12 - eqt + baseOffset;
    const fajrH = sunAngleTime(jd, coords.lat, 18.5, true) + baseOffset;
    const sunriseH = sunAngleTime(jd, coords.lat, 0.833, true) + baseOffset;
    const asrH = asrTime(jd, coords.lat) + baseOffset;
    const maghribH = sunAngleTime(jd, coords.lat, 0.833, false) + baseOffset;
    const ishaH = maghribH + ishaOffsetMinutes / 60;

    return {
      fajr: formatHours(fajrH),
      sunrise: formatHours(sunriseH),
      dhuhr: formatHours(dhuhrH),
      asr: formatHours(asrH),
      maghrib: formatHours(maghribH),
      isha: formatHours(ishaH),
      isRamadan,
      ishaOffsetMinutes,
      source: isRamadan
        ? 'حساب فلكي بتوقيت مكة (أم القرى — عشاء رمضان +120 د)'
        : 'حساب فلكي بتوقيت مكة (تقويم أم القرى — فجر 18.5° / عشاء +90 د)',
    };
  }

  getPrayerScheduleState(city: CityLocation = CityLocation.MAKKAH, currentTime: Date = new Date()): PrayerScheduleState {
    const times = this.getPrayerTimes(city, currentTime);
    const riyadh = getRiyadhParts(currentTime);
    const nowSecs = riyadh.hour * 3600 + riyadh.minute * 60 + riyadh.second;

    const toSecs = (hhmm: string): number => {
      const [h, m] = hhmm.split(':').map(Number);
      return h * 3600 + m * 60;
    };

    const prayers: Array<{ key: PrayerKey; nameAr: string; nameEn: string; timeStr: string; secs: number }> = [
      { key: 'fajr', nameAr: 'الفجر', nameEn: 'Fajr', timeStr: times.fajr, secs: toSecs(times.fajr) },
      { key: 'sunrise', nameAr: 'الشروق', nameEn: 'Sunrise', timeStr: times.sunrise, secs: toSecs(times.sunrise) },
      { key: 'dhuhr', nameAr: 'الظهر', nameEn: 'Dhuhr', timeStr: times.dhuhr, secs: toSecs(times.dhuhr) },
      { key: 'asr', nameAr: 'العصر', nameEn: 'Asr', timeStr: times.asr, secs: toSecs(times.asr) },
      { key: 'maghrib', nameAr: 'المغرب', nameEn: 'Maghrib', timeStr: times.maghrib, secs: toSecs(times.maghrib) },
      { key: 'isha', nameAr: 'العشاء', nameEn: 'Isha', timeStr: times.isha, secs: toSecs(times.isha) },
    ];

    const nextIdx = prayers.findIndex((p) => p.secs > nowSecs);

    let nextKey: PrayerKey;
    let nextNameAr: string;
    let nextNameEn: string;
    let nextTimeStr: string;
    let secondsRemaining: number;
    let prevStartSecs: number;
    let nextTargetSecs: number;
    let isTomorrow = false;

    if (nextIdx >= 0) {
      const active = prayers[nextIdx];
      nextKey = active.key;
      nextNameAr = active.nameAr;
      nextNameEn = active.nameEn;
      nextTimeStr = active.timeStr;
      nextTargetSecs = active.secs;
      secondsRemaining = Math.max(0, nextTargetSecs - nowSecs);

      if (nextIdx === 0) {
        const yesterday = new Date(currentTime.getTime() - 24 * 60 * 60 * 1000);
        const yTimes = this.getPrayerTimes(city, yesterday);
        prevStartSecs = toSecs(yTimes.isha) - 86400;
      } else {
        prevStartSecs = prayers[nextIdx - 1].secs;
      }
    } else {
      const tomorrow = new Date(currentTime.getTime() + 24 * 60 * 60 * 1000);
      const tTimes = this.getPrayerTimes(city, tomorrow);
      nextKey = 'fajr';
      nextNameAr = 'الفجر';
      nextNameEn = 'Fajr';
      nextTimeStr = tTimes.fajr;
      isTomorrow = true;
      nextTargetSecs = 86400 + toSecs(tTimes.fajr);
      secondsRemaining = Math.max(0, nextTargetSecs - nowSecs);
      prevStartSecs = prayers[prayers.length - 1].secs;
    }

    // Use Temporal ZonedDateTime duration when natively available, with deterministic Asia/Riyadh seconds math fallback
    interface MinimalTemporalApi {
      Instant?: {
        fromEpochMilliseconds(ms: number): {
          toZonedDateTimeISO(tz: string): {
            until(
              other: unknown,
              opts: { largestUnit: string; smallestUnit: string }
            ): { seconds: number };
          };
        };
      };
      PlainDate?: {
        from(isoDate: string): {
          add(dur: { days: number }): {
            toPlainDateTime(time: string): { toZonedDateTime(tz: string): unknown };
          };
          toPlainDateTime(time: string): { toZonedDateTime(tz: string): unknown };
        };
      };
    }
    const TemporalApi = (globalThis as { Temporal?: MinimalTemporalApi }).Temporal;
    if (TemporalApi?.Instant && TemporalApi?.PlainDate) {
      try {
        const pad2 = (n: number) => String(n).padStart(2, '0');
        const dateStr = `${riyadh.year}-${pad2(riyadh.month)}-${pad2(riyadh.day)}`;
        const nowZdt = TemporalApi.Instant.fromEpochMilliseconds(currentTime.getTime()).toZonedDateTimeISO('Asia/Riyadh');
        const baseDate = TemporalApi.PlainDate.from(dateStr);
        const targetDate = isTomorrow ? baseDate.add({ days: 1 }) : baseDate;
        const targetZdt = targetDate.toPlainDateTime(`${nextTimeStr}:00`).toZonedDateTime('Asia/Riyadh');
        const remDur = nowZdt.until(targetZdt, { largestUnit: 'second', smallestUnit: 'second' });
        secondsRemaining = Math.max(0, Math.round(remDur.seconds));
      } catch {
        // fallback already computed cleanly above
      }
    }

    const totalWindow = Math.max(1, nextTargetSecs - prevStartSecs);
    const elapsedWindow = Math.max(0, Math.min(totalWindow, nowSecs - prevStartSecs));
    const progressPercent = Math.round((elapsedWindow / totalWindow) * 100);
    const diffMins = Math.ceil(secondsRemaining / 60);

    let matafWarning: string | undefined;
    if (city === CityLocation.MAKKAH && diffMins <= 25 && nextKey !== 'sunrise') {
      matafWarning = `تنبيه هام: متبقي ${diffMins} دقيقة على أذان ${nextNameAr} (بتوقيت مكة). تبدأ قوات أمن الحرمين في إخلاء صحن المطاف للمصلين فقط ومنع دخول الطائفين مؤقتاً لحين انتهاء صلاة الفريضة.`;
    }

    const cards: PrayerCardState[] = prayers.map((p, idx) => {
      if (!isTomorrow) {
        if (idx < nextIdx) {
          return {
            key: p.key,
            nameAr: p.nameAr,
            nameEn: p.nameEn,
            timeStr: p.timeStr,
            status: 'passed',
            isTomorrow: false,
            minutesUntil: 0,
            progressPercent: 100,
          };
        }
        if (idx === nextIdx) {
          return {
            key: p.key,
            nameAr: p.nameAr,
            nameEn: p.nameEn,
            timeStr: p.timeStr,
            status: 'active',
            isTomorrow: false,
            minutesUntil: diffMins,
            progressPercent,
          };
        }
        return {
          key: p.key,
          nameAr: p.nameAr,
          nameEn: p.nameEn,
          timeStr: p.timeStr,
          status: 'upcoming',
          isTomorrow: false,
          minutesUntil: Math.ceil((p.secs - nowSecs) / 60),
          progressPercent: 0,
        };
      }

      // After Isha: Fajr becomes active for tomorrow, others are passed
      if (p.key === 'fajr') {
        return {
          key: p.key,
          nameAr: p.nameAr,
          nameEn: p.nameEn,
          timeStr: nextTimeStr,
          status: 'active',
          isTomorrow: true,
          minutesUntil: diffMins,
          progressPercent,
        };
      }
      return {
        key: p.key,
        nameAr: p.nameAr,
        nameEn: p.nameEn,
        timeStr: p.timeStr,
        status: 'passed',
        isTomorrow: false,
        minutesUntil: 0,
        progressPercent: 100,
      };
    });

    return {
      times,
      next: {
        key: nextKey,
        nameAr: nextNameAr,
        nameEn: nextNameEn,
        prayerTime: nextTimeStr,
        minutesRemaining: diffMins,
        secondsRemaining,
        isTomorrow,
        progressPercent,
        matafWarning,
      },
      cards,
    };
  }

  getNextPrayer(city: CityLocation = CityLocation.MAKKAH, currentTime: Date = new Date()): NextPrayerInfo {
    const { next } = this.getPrayerScheduleState(city, currentTime);
    return {
      nameAr: next.nameAr,
      nameEn: next.nameEn,
      prayerTime: next.prayerTime,
      minutesRemaining: next.minutesRemaining,
      matafWarning: next.matafWarning,
    };
  }
}
