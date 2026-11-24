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
}

export interface NextPrayerInfo {
  nameAr: string;
  nameEn: string;
  prayerTime: string;
  minutesRemaining: number;
  matafWarning?: string;
}

export class PrayerTimesEngine {
  // Umm Al-Qura standard representative prayer times
  private static readonly CITY_SCHEDULES: Record<CityLocation, { name: string; hours: Record<string, string> }> = {
    [CityLocation.MAKKAH]: {
      name: 'المسجد الحرام بمكة المكرمة',
      hours: {
        fajr: '05:15',
        sunrise: '06:35',
        dhuhr: '12:30',
        asr: '15:45',
        maghrib: '18:25',
        isha: '19:55',
      },
    },
    [CityLocation.MADINAH]: {
      name: 'المسجد النبوي الشريف بالمدينة المنورة',
      hours: {
        fajr: '05:18',
        sunrise: '06:40',
        dhuhr: '12:32',
        asr: '15:48',
        maghrib: '18:24',
        isha: '19:54',
      },
    },
  };

  getPrayerTimes(city: CityLocation = CityLocation.MAKKAH): PrayerTimes {
    const hours = PrayerTimesEngine.CITY_SCHEDULES[city].hours;
    return {
      fajr: hours.fajr,
      sunrise: hours.sunrise,
      dhuhr: hours.dhuhr,
      asr: hours.asr,
      maghrib: hours.maghrib,
      isha: hours.isha,
    };
  }

  getNextPrayer(city: CityLocation = CityLocation.MAKKAH, currentTime: Date = new Date()): NextPrayerInfo {
    const hours = PrayerTimesEngine.CITY_SCHEDULES[city].hours;
    const currentMins = currentTime.getHours() * 60 + currentTime.getMinutes();

    const prayers = [
      { key: 'fajr', nameAr: 'الفجر', nameEn: 'Fajr', timeStr: hours.fajr },
      { key: 'sunrise', nameAr: 'الشروق', nameEn: 'Sunrise', timeStr: hours.sunrise },
      { key: 'dhuhr', nameAr: 'الظهر', nameEn: 'Dhuhr', timeStr: hours.dhuhr },
      { key: 'asr', nameAr: 'العصر', nameEn: 'Asr', timeStr: hours.asr },
      { key: 'maghrib', nameAr: 'المغرب', nameEn: 'Maghrib', timeStr: hours.maghrib },
      { key: 'isha', nameAr: 'العشاء', nameEn: 'Isha', timeStr: hours.isha },
    ];

    for (const p of prayers) {
      const [h, m] = p.timeStr.split(':').map(Number);
      const prayerMins = h * 60 + m;

      if (prayerMins > currentMins) {
        const diffMins = prayerMins - currentMins;
        let matafWarning: string | undefined;

        if (city === CityLocation.MAKKAH && diffMins <= 25 && p.key !== 'sunrise') {
          matafWarning = `تنبيه هام: متبقي ${diffMins} دقيقة على أذان ${p.nameAr}. تبدأ قوات أمن الحرمين في إخلاء صحن المطاف للمصلين فقط ومنع دخول الطائفين مؤقتاً لحين انتهاء صلاة الفريضة.`;
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

    // If after Isha, next is tomorrow's Fajr
    const [fh, fm] = hours.fajr.split(':').map(Number);
    const tomorrowFajrMins = 24 * 60 + (fh * 60 + fm);
    const diffMins = tomorrowFajrMins - currentMins;

    return {
      nameAr: 'الفجر',
      nameEn: 'Fajr',
      prayerTime: hours.fajr,
      minutesRemaining: diffMins,
    };
  }
}
