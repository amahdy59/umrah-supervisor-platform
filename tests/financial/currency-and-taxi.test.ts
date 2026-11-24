import { describe, it, expect } from 'vitest';
import { CurrencyAndTaxiService } from '../../src/financial/currency-and-taxi.js';

describe('CurrencyAndTaxiService - محول العملات ودليل أسعار التاكسي', () => {
  const service = new CurrencyAndTaxiService();

  it('should accurately convert SAR to EGP and USD', () => {
    const sar100InEgp = service.convertSARtoEGP(100);
    expect(sar100InEgp).toBe(1315);

    const sar100InUsd = service.convertSARtoUSD(100);
    expect(sar100InUsd).toBe(26.7);
  });

  it('should provide standard taxi routes and fair price ranges in Makkah & Madinah', () => {
    const makkahRoutes = service.getRoutesByCity('MAKKAH');
    expect(makkahRoutes.length).toBeGreaterThanOrEqual(3);

    const trainRoute = makkahRoutes.find((r) => r.id === 'mkk-haram-train');
    expect(trainRoute).toBeDefined();
    expect(trainRoute?.fairPriceMinSAR).toBe(25);
    expect(trainRoute?.fairPriceMaxSAR).toBe(35);
  });
});
