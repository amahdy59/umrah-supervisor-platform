-- ====================================================================
-- Umrah Supervisor Platform - Production Database Schema (PostgreSQL/Supabase)
-- ====================================================================

-- Enable PostGIS for geospatial coordinates and UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Enum Types
CREATE TYPE trip_status AS ENUM (
  'DRAFT',
  'REGISTRATION_OPEN',
  'PRE_DEPARTURE',
  'IN_TRANSIT',
  'IN_MAKKAH',
  'IN_MADINAH',
  'RETURN_TRANSIT',
  'COMPLETED'
);

CREATE TYPE gender_type AS ENUM ('MALE', 'FEMALE');

CREATE TYPE room_type AS ENUM ('DOUBLE', 'TRIPLE', 'QUAD', 'SUITE');

CREATE TYPE gameya_type AS ENUM ('ROTATING_ROSCA', 'DIRECT_INSTALLMENT');

CREATE TYPE installment_status AS ENUM ('PENDING', 'PARTIALLY_PAID', 'PAID', 'OVERDUE');

CREATE TYPE payment_method AS ENUM ('CASH', 'BANK_TRANSFER', 'INSTAPAY', 'VODAFONE_CASH', 'CARD');

CREATE TYPE broadcast_priority AS ENUM ('NORMAL', 'SCHEDULE_CHANGE', 'URGENT', 'EMERGENCY');

-- 1. Trips Table
CREATE TABLE trips (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  supervisor_id UUID NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status trip_status NOT NULL DEFAULT 'DRAFT',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Hotels Table
CREATE TABLE hotels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name_ar VARCHAR(255) NOT NULL,
  name_en VARCHAR(255) NOT NULL,
  city VARCHAR(50) NOT NULL CHECK (city IN ('MAKKAH', 'MADINAH')),
  address_ar TEXT NOT NULL,
  address_en TEXT NOT NULL,
  reception_phone VARCHAR(50) NOT NULL,
  location GEOGRAPHY(Point, 4326) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Rooms Table
CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  room_number VARCHAR(50) NOT NULL,
  floor_number INT NOT NULL,
  type room_type NOT NULL DEFAULT 'DOUBLE',
  capacity INT NOT NULL DEFAULT 2,
  is_family_room BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Buses Table
CREATE TABLE buses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  bus_number VARCHAR(50) NOT NULL,
  plate_number VARCHAR(50) NOT NULL,
  driver_name VARCHAR(100) NOT NULL,
  driver_phone VARCHAR(50) NOT NULL,
  capacity INT NOT NULL DEFAULT 45,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Pilgrims Table
CREATE TABLE pilgrims (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  full_name VARCHAR(255) NOT NULL,
  gender gender_type NOT NULL,
  phone VARCHAR(50) NOT NULL,
  saudi_sim_phone VARCHAR(50),
  passport_number VARCHAR(50) NOT NULL,
  national_id VARCHAR(50),
  visa_number VARCHAR(50),
  nusuk_id VARCHAR(50),
  room_id UUID REFERENCES rooms(id) ON DELETE SET NULL,
  bus_id UUID REFERENCES buses(id) ON DELETE SET NULL,
  medical_conditions TEXT[],
  wheelchair_needed BOOLEAN NOT NULL DEFAULT FALSE,
  emergency_contact_name VARCHAR(100),
  emergency_contact_phone VARCHAR(50),
  digital_badge_token VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Gam'eya Groups (نظام الجمعيات وتقسيط العمرة)
CREATE TABLE gameya_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  supervisor_id UUID NOT NULL,
  trip_id UUID REFERENCES trips(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  type gameya_type NOT NULL DEFAULT 'DIRECT_INSTALLMENT',
  target_amount_minor BIGINT NOT NULL, -- in minor currency units (cents/piastres)
  duration_months INT NOT NULL,
  start_date DATE NOT NULL,
  currency VARCHAR(10) NOT NULL DEFAULT 'EGP',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Gam'eya Members
CREATE TABLE gameya_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES gameya_groups(id) ON DELETE CASCADE,
  pilgrim_id UUID REFERENCES pilgrims(id) ON DELETE SET NULL,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  turn_number INT, -- for ROTATING_ROSCA
  payout_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Installment Schedules
CREATE TABLE installment_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID NOT NULL REFERENCES gameya_members(id) ON DELETE CASCADE,
  installment_number INT NOT NULL,
  due_date DATE NOT NULL,
  amount_due_minor BIGINT NOT NULL,
  amount_paid_minor BIGINT NOT NULL DEFAULT 0,
  status installment_status NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Payment Transactions & Receipts
CREATE TABLE payment_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  schedule_id UUID NOT NULL REFERENCES installment_schedules(id) ON DELETE CASCADE,
  receipt_number VARCHAR(100) UNIQUE NOT NULL,
  amount_paid_minor BIGINT NOT NULL,
  method payment_method NOT NULL,
  transaction_ref VARCHAR(255),
  receipt_image_url TEXT,
  recorded_by_supervisor_id UUID NOT NULL,
  verified BOOLEAN NOT NULL DEFAULT TRUE,
  paid_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. Emergency SOS Alerts
CREATE TABLE sos_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  pilgrim_id UUID NOT NULL REFERENCES pilgrims(id) ON DELETE CASCADE,
  location GEOGRAPHY(Point, 4326) NOT NULL,
  battery_level INT,
  notes TEXT,
  resolved BOOLEAN NOT NULL DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. Broadcast Messages
CREATE TABLE broadcasts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  supervisor_id UUID NOT NULL,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  priority broadcast_priority NOT NULL DEFAULT 'NORMAL',
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_trips_supervisor ON trips(supervisor_id);
CREATE INDEX idx_pilgrims_trip ON pilgrims(trip_id);
CREATE INDEX idx_pilgrims_room ON pilgrims(room_id);
CREATE INDEX idx_pilgrims_bus ON pilgrims(bus_id);
CREATE INDEX idx_gameya_supervisor ON gameya_groups(supervisor_id);
CREATE INDEX idx_installment_member ON installment_schedules(member_id);
CREATE INDEX idx_sos_unresolved ON sos_alerts(trip_id, resolved) WHERE resolved = FALSE;
CREATE INDEX idx_hotels_location ON hotels USING GIST (location);
CREATE INDEX idx_sos_location ON sos_alerts USING GIST (location);

-- Row-Level Security (RLS) Setup
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE pilgrims ENABLE ROW LEVEL SECURITY;
ALTER TABLE gameya_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE installment_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE sos_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE broadcasts ENABLE ROW LEVEL SECURITY;

-- Supervisors can manage their own trips and data
CREATE POLICY supervisor_trip_policy ON trips
  FOR ALL USING (auth.uid() = supervisor_id);

CREATE POLICY supervisor_pilgrim_policy ON pilgrims
  FOR ALL USING (
    EXISTS (SELECT 1 FROM trips WHERE trips.id = pilgrims.trip_id AND trips.supervisor_id = auth.uid())
  );
