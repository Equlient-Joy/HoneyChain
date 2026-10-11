CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE organisations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type TEXT NOT NULL CHECK (type IN ('farmer', 'society_fpo', 'aggregator', 'lab', 'retailer', 'station', 'regulator')),
    name TEXT NOT NULL,
    state TEXT NOT NULL,
    district TEXT NOT NULL,
    language TEXT NOT NULL DEFAULT 'en',
    madhukranti_no TEXT,
    registry_status TEXT NOT NULL DEFAULT 'not_registered' CHECK (registry_status IN ('not_registered', 'self_declared', 'verified', 'expired')),
    registry_checked_at TIMESTAMPTZ,
    fssai_no TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE apiaries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organisations(id),
    name TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'farm',
    district TEXT NOT NULL,
    lat NUMERIC(9,6),
    lon NUMERIC(9,6),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE hives (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    apiary_id UUID NOT NULL REFERENCES apiaries(id),
    hive_code TEXT NOT NULL UNIQUE,
    species TEXT NOT NULL CHECK (species IN ('apis_cerana_indica', 'apis_mellifera')),
    box_type TEXT NOT NULL,
    frame_count INTEGER NOT NULL DEFAULT 8,
    mode TEXT NOT NULL DEFAULT 'production' CHECK (mode IN ('production', 'research_fed', 'transition')),
    feeder_state TEXT NOT NULL DEFAULT 'locked' CHECK (feeder_state IN ('locked', 'open', 'quarantine')),
    quarantine_until TIMESTAMPTZ,
    evidence_capability TEXT NOT NULL DEFAULT 'sensor' CHECK (evidence_capability IN ('sensor', 'manual')),
    supers_on BOOLEAN NOT NULL DEFAULT FALSE,
    supers_on_since TIMESTAMPTZ,
    weight_at_supers_on_kg NUMERIC(6,2),
    target_super_gain_kg NUMERIC(6,2) DEFAULT 10.0,
    node_id TEXT,
    device_public_key TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT production_no_open_feeder CHECK (mode != 'production' OR feeder_state != 'open')
);

CREATE TABLE telemetry_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hive_id UUID NOT NULL REFERENCES hives(id),
    message_id UUID NOT NULL,
    seq INTEGER NOT NULL,
    recorded_at TIMESTAMPTZ NOT NULL,
    hive_weight_kg NUMERIC(6,3) NOT NULL,
    feeder_weight_kg NUMERIC(6,3),
    brood_temp_c NUMERIC(5,2),
    brood_rh_pct NUMERIC(5,2),
    ambient_temp_c NUMERIC(5,2),
    ambient_rh_pct NUMERIC(5,2),
    lid_open BOOLEAN DEFAULT FALSE,
    battery_v NUMERIC(4,2) NOT NULL,
    quality_flags TEXT[],
    signature_valid BOOLEAN NOT NULL DEFAULT TRUE,
    payload_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (hive_id, recorded_at),
    UNIQUE (hive_id, seq)
);

CREATE INDEX idx_telemetry_hive_recorded ON telemetry_logs (hive_id, recorded_at DESC);
