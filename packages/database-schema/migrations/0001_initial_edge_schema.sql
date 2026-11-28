-- ====================================================================
-- Migration 0001: Initial Edge Schema (Workspaces, Badges, Live SOS)
-- ====================================================================

CREATE TABLE IF NOT EXISTS group_workspaces (
  id TEXT PRIMARY KEY,
  trip_code TEXT NOT NULL,
  trip_title TEXT NOT NULL,
  stage TEXT NOT NULL,
  payload_json TEXT NOT NULL,
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

CREATE INDEX IF NOT EXISTS idx_group_trip_code ON group_workspaces(trip_code);
CREATE INDEX IF NOT EXISTS idx_badge_group ON pilgrim_badges(group_id);
CREATE INDEX IF NOT EXISTS idx_sos_trip_open ON sos_events(trip_code, resolved);
