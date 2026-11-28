-- ====================================================================
-- Umrah Supervisor Platform - Cloudflare D1 (SQLite) Edge Schema
-- Apply versioned migrations via:
--   npx wrangler d1 migrations apply umrah-db --local
--   npx wrangler d1 migrations apply umrah-db --remote
-- ====================================================================

CREATE TABLE IF NOT EXISTS group_workspaces (
  id TEXT PRIMARY KEY,
  trip_code TEXT NOT NULL,
  trip_title TEXT NOT NULL,
  stage TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS pilgrim_badges (
  badge_token TEXT PRIMARY KEY,
  group_id TEXT NOT NULL,
  pilgrim_id TEXT NOT NULL,
  badge_json TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sos_events (
  id TEXT PRIMARY KEY,
  trip_code TEXT NOT NULL,
  pilgrim_name TEXT NOT NULL,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  notes TEXT,
  resolved INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS people_directory (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  gender TEXT NOT NULL CHECK (gender IN ('MALE', 'FEMALE')),
  passport_number TEXT NOT NULL,
  passport_expiry TEXT,
  phone TEXT NOT NULL,
  emergency_name TEXT NOT NULL DEFAULT '',
  emergency_phone TEXT NOT NULL DEFAULT '',
  requires_wheelchair INTEGER NOT NULL DEFAULT 0,
  requires_insulin INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);

CREATE TABLE IF NOT EXISTS gameya_plans (
  id TEXT PRIMARY KEY,
  group_id TEXT NOT NULL,
  member_name TEXT NOT NULL,
  phone TEXT NOT NULL DEFAULT '',
  plan_type TEXT NOT NULL,
  turn_month INTEGER NOT NULL DEFAULT 1,
  total_target_minor INTEGER NOT NULL,
  down_payment_minor INTEGER NOT NULL DEFAULT 0,
  installment_count INTEGER NOT NULL DEFAULT 1,
  total_paid_minor INTEGER NOT NULL DEFAULT 0,
  start_date TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (group_id) REFERENCES group_workspaces(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS installment_schedules (
  id TEXT PRIMARY KEY,
  plan_id TEXT NOT NULL,
  group_id TEXT NOT NULL,
  installment_number INTEGER NOT NULL,
  label_ar TEXT NOT NULL,
  due_date TEXT NOT NULL,
  amount_due_minor INTEGER NOT NULL,
  amount_paid_minor INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'PENDING',
  UNIQUE (plan_id, installment_number),
  FOREIGN KEY (plan_id) REFERENCES gameya_plans(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS payment_ledger (
  id TEXT PRIMARY KEY,
  plan_id TEXT NOT NULL,
  group_id TEXT NOT NULL,
  amount_minor INTEGER NOT NULL CHECK (amount_minor > 0),
  method TEXT NOT NULL,
  transaction_ref TEXT,
  paid_date TEXT NOT NULL,
  entry_type TEXT NOT NULL DEFAULT 'PAYMENT' CHECK (entry_type IN ('PAYMENT', 'REVERSAL')),
  reversed_payment_id TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (plan_id) REFERENCES gameya_plans(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_group_trip_code ON group_workspaces(trip_code);
CREATE INDEX IF NOT EXISTS idx_badge_group ON pilgrim_badges(group_id);
CREATE INDEX IF NOT EXISTS idx_sos_trip_open ON sos_events(trip_code, resolved);
CREATE UNIQUE INDEX IF NOT EXISTS idx_people_passport ON people_directory(passport_number);
CREATE INDEX IF NOT EXISTS idx_people_phone ON people_directory(phone);
CREATE INDEX IF NOT EXISTS idx_gameya_group ON gameya_plans(group_id);
CREATE INDEX IF NOT EXISTS idx_sched_group_due ON installment_schedules(group_id, due_date);
CREATE INDEX IF NOT EXISTS idx_ledger_plan ON payment_ledger(plan_id, created_at);
CREATE INDEX IF NOT EXISTS idx_ledger_group ON payment_ledger(group_id, paid_date);
