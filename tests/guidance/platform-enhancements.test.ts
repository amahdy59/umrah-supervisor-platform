import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { onRequestGet as syncGet, onRequestPost as syncPost } from '../../functions/api/sync.js';
import { onRequestGet as peopleGet, onRequestPost as peoplePost } from '../../functions/api/people.js';
import {
  onRequestGet as sosGet,
  onRequestPost as sosPost,
  onRequestPatch as sosPatch,
} from '../../functions/api/sos.js';
import { onRequestPost as badgeWritePost } from '../../functions/api/badge/write.js';
import { onRequestGet as badgeReadGet } from '../../functions/api/badge/[token].js';
import { migrateRootState, CURRENT_ROOT_SCHEMA_VERSION } from '../../src/ui/supervisor/migrations.js';
import { HaramainAtlasCatalog } from '../../src/guidance/haramain-gates-and-services.js';
import { ZiyaratGuideCatalog } from '../../src/guidance/ziyarat-guide.js';
import { HaramGatesGuide } from '../../src/guidance/haram-gates-guide.js';
import { HaramainBestPracticesCatalog } from '../../src/guidance/rituals-and-best-practices.js';
import { MIQAT_ROUTE_GUIDES, OFFICIAL_SAUDI_RESOURCES } from '../../src/guidance/official-resources.js';
import { PackingCatalog } from '../../src/guidance/packing-checklist.js';
import { FiqhAssistant } from '../../src/guidance/whatsapp-and-fiqh.js';
import { WomenFiqhCatalog } from '../../src/guidance/women-fiqh.js';
import { CurrencyAndTaxiService } from '../../src/financial/currency-and-taxi.js';
import { TripStatus } from '../../src/operations/trip-logistics.js';
import { getDictionaryEntry, getDictionaryKeys } from '../../src/ui/i18n.js';
import {
  FIELD_GUIDES_EN,
  FIQH_RULINGS_EN,
  HARAM_ATLAS_EN,
  HARAM_BENEFITS_EN,
  HARAM_GATES_EN,
  MIQAT_ROUTES_EN,
  OFFICIAL_RESOURCES_EN,
  PACKING_ITEMS_EN,
  TAXI_ROUTES_EN,
  TRIP_STAGE_LABELS_EN,
  WOMEN_FIQH_EN,
  ZIYARAT_SITES_EN,
} from '../../src/ui/guidance-en.js';

function createMockD1() {
  const workspaces = new Map<
    string,
    { id: string; trip_code: string; trip_title: string; stage: string; payload_json: string; version: number; updated_at: string }
  >();
  const badges = new Map<string, { badge_token: string; group_id: string; pilgrim_id: string; badge_json: string; updated_at: string }>();
  const sos = new Map<string, { id: string; trip_code: string; pilgrim_name: string; latitude: number; longitude: number; notes: string; resolved: number; created_at: string }>();
  const people = new Map<string, Record<string, unknown>>();
  const plans = new Map<string, Record<string, unknown>>();
  const ledger = new Map<string, Record<string, unknown>>();

  return {
    workspaces,
    badges,
    sos,
    people,
    plans,
    ledger,
    prepare(query: string) {
      const makeRunner = (...values: unknown[]) => ({
        async first<T = Record<string, unknown>>(): Promise<T | null> {
          if (query.includes('FROM group_workspaces')) {
            return (workspaces.get(String(values[0])) as unknown as T) || null;
          }
          if (query.includes('FROM pilgrim_badges')) {
            return (badges.get(String(values[0])) as unknown as T) || null;
          }
          return null;
        },
        async all<T = Record<string, unknown>>(): Promise<{ results: T[] }> {
          if (query.includes('FROM sos_events')) {
            const items = Array.from(sos.values()).filter((ev) => {
              if (query.includes('trip_code = ?')) {
                return ev.trip_code === String(values[0]) && ev.resolved === Number(values[1]);
              }
              return ev.resolved === Number(values[0]);
            });
            return { results: items as unknown as T[] };
          }
          if (query.includes('FROM people_directory')) {
            return { results: Array.from(people.values()) as unknown as T[] };
          }
          return { results: [] };
        },
        async run(): Promise<{ success: boolean }> {
          if (query.includes('INTO group_workspaces')) {
            const existing = workspaces.get(String(values[0]));
            workspaces.set(String(values[0]), {
              id: String(values[0]),
              trip_code: String(values[1]),
              trip_title: String(values[2]),
              stage: String(values[3]),
              payload_json: String(values[4]),
              version: existing?.version ?? 1,
              updated_at: String(values[5]),
            });
          } else if (query.includes('UPDATE group_workspaces SET version')) {
            const existing = workspaces.get(String(values[1]));
            if (existing) existing.version = Number(values[0]);
          } else if (query.includes('INTO gameya_plans')) {
            plans.set(String(values[0]), { id: values[0], group_id: values[1], member_name: values[2] });
          } else if (query.includes('INTO payment_ledger')) {
            if (!ledger.has(String(values[0]))) {
              ledger.set(String(values[0]), { id: values[0], plan_id: values[1], amount_minor: values[3] });
            }
          } else if (query.includes('INTO people_directory')) {
            people.set(String(values[3]), {
              id: String(values[0]),
              full_name: String(values[1]),
              gender: String(values[2]),
              passport_number: String(values[3]),
              passport_expiry: values[4],
              phone: String(values[5]),
              emergency_name: String(values[6]),
              emergency_phone: String(values[7]),
              requires_wheelchair: Number(values[8]),
              requires_insulin: Number(values[9]),
              notes: values[10],
              updated_at: String(values[11]),
            });
          } else if (query.includes('INTO pilgrim_badges')) {
            badges.set(String(values[0]), {
              badge_token: String(values[0]),
              group_id: String(values[1]),
              pilgrim_id: String(values[2]),
              badge_json: String(values[3]),
              updated_at: String(values[4]),
            });
          } else if (query.includes('INTO sos_events')) {
            sos.set(String(values[0]), {
              id: String(values[0]),
              trip_code: String(values[1]),
              pilgrim_name: String(values[2]),
              latitude: Number(values[3]),
              longitude: Number(values[4]),
              notes: String(values[5]),
              resolved: 0,
              created_at: String(values[6]),
            });
          } else if (query.includes('UPDATE sos_events SET resolved')) {
            const item = sos.get(String(values[1]));
            if (item) item.resolved = Number(values[0]);
          }
          return { success: true };
        },
      });
      return {
        bind: (...values: unknown[]) => makeRunner(...values),
        all: <T = Record<string, unknown>>() => makeRunner().all<T>(),
      };
    },
  };
}

describe('Cloudflare D1 Auth & Endpoints', () => {
  it('enforces Bearer token auth when SYNC_SECRET is configured on sync, sos GET/PATCH, and badge write', async () => {
    const db = createMockD1();
    const env = { DB: db, SYNC_SECRET: 'super-secret-token' };

    // Unauthenticated requests fail 401
    expect(
      (await syncGet({ request: new Request('https://x.dev/api/sync?groupId=g1'), env })).status
    ).toBe(401);
    expect(
      (await syncPost({ request: new Request('https://x.dev/api/sync', { method: 'POST', body: '{}' }), env })).status
    ).toBe(401);
    expect(
      (await sosGet({ request: new Request('https://x.dev/api/sos'), env })).status
    ).toBe(401);
    expect(
      (
        await badgeWritePost({
          request: new Request('https://x.dev/api/badge/write', {
            method: 'POST',
            headers: { Authorization: 'Bearer wrong-token' },
            body: '{}',
          }),
          env,
        })
      ).status
    ).toBe(401);

    // Authenticated requests succeed
    const authHeaders = {
      'Content-Type': 'application/json',
      Authorization: 'Bearer super-secret-token',
    };

    const pushRes = await syncPost({
      request: new Request('https://x.dev/api/sync', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          groupId: 'grp-1',
          workspace: { settings: { tripCode: '#T1', tripTitle: 'Test Trip', status: 'IN_MAKKAH' } },
        }),
      }),
      env,
    });
    expect(pushRes.status).toBe(200);
    expect(db.workspaces.size).toBe(1);

    const pullRes = await syncGet({
      request: new Request('https://x.dev/api/sync?groupId=grp-1', {
        headers: { Authorization: 'Bearer super-secret-token' },
      }),
      env,
    });
    const pullJson = (await pullRes.json()) as { found: boolean; workspace: { settings: { tripCode: string } } };
    expect(pullJson.found).toBe(true);
    expect(pullJson.workspace.settings.tripCode).toBe('#T1');
  });

  it('writes and reads pilgrim badges via badge_token and handles public SOS -> supervisor resolution', async () => {
    const db = createMockD1();
    const env = { DB: db, SYNC_SECRET: 'tok-99' };

    const writeRes = await badgeWritePost({
      request: new Request('https://x.dev/api/badge/write', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer tok-99' },
        body: JSON.stringify({
          groupId: 'grp-1',
          pilgrimId: 'p-1',
          badgeToken: 'grp1-p1',
          badgeData: { fullName: 'Tariq Hassan', roomNumber: '405' },
        }),
      }),
      env,
    });
    expect(writeRes.status).toBe(200);

    const readRes = await badgeReadGet({ params: { token: 'grp1-p1' }, env });
    expect(readRes.status).toBe(200);
    const readJson = (await readRes.json()) as { found: boolean; badge: { fullName: string } };
    expect(readJson.found).toBe(true);
    expect(readJson.badge.fullName).toBe('Tariq Hassan');

    // Public SOS POST allowed without supervisor token
    const postSos = await sosPost({
      request: new Request('https://x.dev/api/sos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tripCode: '#SHB-A',
          pilgrimName: 'Saad Ali',
          latitude: 21.4225,
          longitude: 39.8262,
          notes: 'Gate 79',
        }),
      }),
      env,
    });
    const createdSos = (await postSos.json()) as { stored: boolean; id: string };
    expect(createdSos.stored).toBe(true);

    // Supervisor GET /api/sos retrieves open event
    const openRes = await sosGet({
      request: new Request('https://x.dev/api/sos?tripCode=%23SHB-A&resolved=0', {
        headers: { Authorization: 'Bearer tok-99' },
      }),
      env,
    });
    const openJson = (await openRes.json()) as { events: Array<{ id: string; pilgrim_name: string }> };
    expect(openJson.events.length).toBe(1);
    expect(openJson.events[0].pilgrim_name).toBe('Saad Ali');

    // Supervisor marks resolved via PATCH
    const patchRes = await sosPatch({
      request: new Request('https://x.dev/api/sos', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer tok-99' },
        body: JSON.stringify({ id: createdSos.id, resolved: true }),
      }),
      env,
    });
    expect(patchRes.status).toBe(200);
    expect(db.sos.get(createdSos.id)?.resolved).toBe(1);
  });

  it('enforces optimistic locking (409 Conflict), persists normalized ledger rows, and syncs /api/people', async () => {
    const db = createMockD1();
    const env = { DB: db, SYNC_SECRET: 'tok-99' };
    const authHeaders = { 'Content-Type': 'application/json', Authorization: 'Bearer tok-99' };

    const firstPush = await syncPost({
      request: new Request('https://x.dev/api/sync', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          groupId: 'grp-opt',
          workspace: {
            settings: { tripCode: '#OPT', tripTitle: 'Locked Trip', status: 'IN_MAKKAH' },
            gameya: [
              {
                id: 'g-1',
                name: 'طارق',
                phone: '0101',
                planType: 'FULL_CASH',
                totalTarget: 40000,
                downPayment: 40000,
                installmentCount: 1,
                totalPaid: 40000,
                startDateIso: '2026-11-01',
                payments: [{ id: 'pay-99', amount: 40000, method: 'CASH', dateIso: '2026-11-01' }],
              },
            ],
          },
        }),
      }),
      env,
    });
    expect(firstPush.status).toBe(200);
    expect(db.plans.size).toBe(1);
    expect(db.ledger.size).toBe(1);

    const secondPush = await syncPost({
      request: new Request('https://x.dev/api/sync', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          groupId: 'grp-opt',
          expectedVersion: 1,
          workspace: { settings: { tripCode: '#OPT', tripTitle: 'Locked Trip v2', status: 'IN_MAKKAH' } },
        }),
      }),
      env,
    });
    const secondJson = (await secondPush.json()) as { version: number };
    expect(secondPush.status).toBe(200);
    expect(secondJson.version).toBe(2);

    const stalePush = await syncPost({
      request: new Request('https://x.dev/api/sync', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          groupId: 'grp-opt',
          expectedVersion: 1,
          workspace: { settings: { tripCode: '#OPT', tripTitle: 'Stale Write', status: 'IN_MAKKAH' } },
        }),
      }),
      env,
    });
    const staleJson = (await stalePush.json()) as { error: string; serverVersion: number };
    expect(stalePush.status).toBe(409);
    expect(staleJson.error).toBe('version_conflict');
    expect(staleJson.serverVersion).toBe(2);

    // /api/people CRM GET + POST + 401 check
    expect(
      (await peopleGet({ request: new Request('https://x.dev/api/people'), env })).status
    ).toBe(401);

    const peopleRes = await peoplePost({
      request: new Request('https://x.dev/api/people', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          people: [
            {
              id: 'per-1',
              fullName: 'محمود أحمد',
              gender: 'MALE',
              passportNumber: 'P554433',
              phone: '01099887766',
              requiresWheelchair: true,
              requiresInsulinRefrigeration: false,
            },
          ],
        }),
      }),
      env,
    });
    expect(peopleRes.status).toBe(200);
    expect(((await peopleRes.json()) as { upserted: number }).upserted).toBe(1);

    const fetchedPeople = await peopleGet({
      request: new Request('https://x.dev/api/people', { headers: { Authorization: 'Bearer tok-99' } }),
      env,
    });
    const fetchedJson = (await fetchedPeople.json()) as { people: Array<{ fullName: string; requiresWheelchair: boolean }> };
    expect(fetchedJson.people).toHaveLength(1);
    expect(fetchedJson.people[0].fullName).toBe('محمود أحمد');
    expect(fetchedJson.people[0].requiresWheelchair).toBe(true);
  });

  it('deterministically migrates legacy v1 supervisor root state to schemaVersion 2', () => {
    const legacy = {
      activeGroupId: 'missing-id',
      groups: [
        {
          id: 'g-legacy',
          settings: {
            tripTitle: 'فوج قديم',
            tripCode: '#OLD',
            status: TripStatus.DRAFT,
            startDate: '2026-12-01',
            endDate: '2026-12-10',
            busNumber: '1',
            hotelKey: 'kiswah',
            hotelNameAr: 'الكسوة',
            hotelNameEn: 'Kiswah',
            hotelAddressAr: 'مكة',
            hotelPhone: '+96612000',
            hotelLat: 21.4,
            hotelLng: 39.8,
            supervisorName: 'مصطفى',
            supervisorPhone: '+2010',
            gatheringTime: '08:00',
            meetingPoint: 'بوابة 1',
          },
          pilgrims: [],
          rooms: [],
          gameya: [],
          luggage: [],
          medical: [],
          sosAlerts: [],
        },
      ],
      people: [],
    };
    const migrated = migrateRootState(legacy, {
      activeGroupId: 'fallback',
      groups: legacy.groups,
      people: [],
    });
    expect(migrated.schemaVersion).toBe(CURRENT_ROOT_SCHEMA_VERSION);
    expect(migrated.activeGroupId).toBe('g-legacy');
    expect(migrated.groups[0].version).toBe(1);
    expect(migrated.groups[0].updatedAt).toBeTruthy();
  });
});

describe('Self-Hosted Assets, Audio & Service Worker Precache', () => {
  it('bundles self-hosted Cairo woff2 fonts, Talbiyah/Dhikr MP3s & chime WAV, D1 SQL migrations, security _headers, and sw v18', () => {
    const requiredAssets = [
      'public/_headers',
      '.gitattributes',
      'packages/database-schema/migrations/0001_initial_edge_schema.sql',
      'packages/database-schema/migrations/0002_normalized_ledger_and_crm.sql',
      'public/fonts/cairo/cairo-arabic.woff2',
      'public/fonts/cairo/cairo-latin-ext.woff2',
      'public/fonts/cairo/cairo-latin.woff2',
      'public/audio/talbiyah.mp3',
      'public/audio/rukn-yamani.mp3',
      'public/audio/safa-marwah.mp3',
      'public/audio/lap-chime.wav',
    ];
    for (const rel of requiredAssets) {
      const full = resolve(process.cwd(), rel);
      expect(existsSync(full), `Missing asset: ${rel}`).toBe(true);
      expect(statSync(full).size).toBeGreaterThan(20);
    }

    const headersContent = readFileSync(resolve(process.cwd(), 'public/_headers'), 'utf8');
    expect(headersContent).toContain('Referrer-Policy: no-referrer');
    expect(headersContent).toContain('X-Content-Type-Options: nosniff');
    expect(headersContent).toContain('Content-Security-Policy:');

    const swContent = readFileSync(resolve(process.cwd(), 'public/sw.js'), 'utf8');
    expect(swContent).toContain('umrah-companion-v18');
    expect(swContent).toContain('/fonts/cairo/cairo-arabic.woff2');
    expect(swContent).toContain('/audio/talbiyah.mp3');
    expect(swContent).toContain('/audio/rukn-yamani.mp3');
    expect(swContent).toContain('/audio/safa-marwah.mp3');
    expect(swContent).toContain('/audio/lap-chime.wav');
  });
});

describe('English (en) i18n Full Coverage', () => {
  it('provides non-empty AR and EN text for every UI dictionary key and guidance catalog item', () => {
    for (const key of getDictionaryKeys()) {
      const entry = getDictionaryEntry(key);
      expect(entry?.ar.trim().length, `Empty AR key: ${key}`).toBeGreaterThan(0);
      expect(entry?.en.trim().length, `Empty EN key: ${key}`).toBeGreaterThan(0);
    }

    const atlas = new HaramainAtlasCatalog();
    for (const item of atlas.getAllLandmarksAndGates()) {
      expect(HARAM_ATLAS_EN[item.id], `Missing HARAM_ATLAS_EN for ${item.id}`).toBeDefined();
    }
    for (const benefit of atlas.getAllBenefits()) {
      expect(HARAM_BENEFITS_EN[benefit.id], `Missing HARAM_BENEFITS_EN for ${benefit.id}`).toBeDefined();
    }
    for (const site of new ZiyaratGuideCatalog().getAllSites()) {
      expect(ZIYARAT_SITES_EN[site.id], `Missing ZIYARAT_SITES_EN for ${site.id}`).toBeDefined();
    }
    for (const gate of new HaramGatesGuide().getAllGates()) {
      expect(HARAM_GATES_EN[gate.gateNumber], `Missing HARAM_GATES_EN for Gate ${gate.gateNumber}`).toBeDefined();
    }
    for (const route of MIQAT_ROUTE_GUIDES) {
      expect(MIQAT_ROUTES_EN[route.id], `Missing MIQAT_ROUTES_EN for ${route.id}`).toBeDefined();
    }
    for (const res of OFFICIAL_SAUDI_RESOURCES) {
      expect(OFFICIAL_RESOURCES_EN[res.id], `Missing OFFICIAL_RESOURCES_EN for ${res.id}`).toBeDefined();
    }
    for (const guide of new HaramainBestPracticesCatalog().getAllGuides()) {
      expect(FIELD_GUIDES_EN[guide.id], `Missing FIELD_GUIDES_EN for ${guide.id}`).toBeDefined();
    }
    for (const item of new PackingCatalog().getAllItems()) {
      expect(PACKING_ITEMS_EN[item.id], `Missing PACKING_ITEMS_EN for ${item.id}`).toBeDefined();
    }
    for (const ruling of new FiqhAssistant().getAllRulings()) {
      expect(FIQH_RULINGS_EN[ruling.id], `Missing FIQH_RULINGS_EN for ${ruling.id}`).toBeDefined();
    }
    for (const topic of new WomenFiqhCatalog().getAllItems()) {
      expect(WOMEN_FIQH_EN[topic.id], `Missing WOMEN_FIQH_EN for ${topic.id}`).toBeDefined();
    }
    for (const fare of new CurrencyAndTaxiService().getAllTaxiRoutes()) {
      expect(TAXI_ROUTES_EN[fare.id], `Missing TAXI_ROUTES_EN for ${fare.id}`).toBeDefined();
    }
    for (const stage of Object.values(TripStatus)) {
      expect(TRIP_STAGE_LABELS_EN[stage], `Missing TRIP_STAGE_LABELS_EN for ${stage}`).toBeDefined();
    }
  });
});
