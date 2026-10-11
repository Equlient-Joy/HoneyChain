-- Trigger function to reject UPDATE or DELETE on evidence tables
CREATE OR REPLACE FUNCTION enforce_append_only()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'EVIDENCE_APPEND_ONLY: % is an append-only audit table. Records cannot be updated or deleted. Insert a new record with supersedes_id instead.', TG_TABLE_NAME;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE harvest_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    supersedes_id UUID REFERENCES harvest_records(id),
    hive_id UUID NOT NULL REFERENCES hives(id),
    harvested_at TIMESTAMPTZ NOT NULL,
    supers_removed INTEGER NOT NULL,
    weight_before_kg NUMERIC(6,2) NOT NULL,
    weight_after_kg NUMERIC(6,2) NOT NULL,
    comb_tare_kg NUMERIC(6,2) NOT NULL,
    extracted_honey_kg NUMERIC(6,2) NOT NULL,
    allowable_yield_kg NUMERIC(6,2) NOT NULL,
    moisture_pct NUMERIC(4,2) NOT NULL,
    yield_check TEXT NOT NULL CHECK (yield_check IN ('PASS', 'REVIEW', 'BLOCK')),
    weight_agreement TEXT NOT NULL CHECK (weight_agreement IN ('PASS', 'REVIEW', 'BLOCK')),
    witness_name TEXT NOT NULL,
    witness_phone_hash TEXT NOT NULL,
    evidence_level TEXT NOT NULL CHECK (evidence_level IN ('sensor_verified', 'manual')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE lots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farmer_org_id UUID NOT NULL REFERENCES organisations(id),
    harvest_record_id UUID NOT NULL REFERENCES harvest_records(id),
    kg_declared NUMERIC(6,2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'READY' CHECK (status IN ('READY', 'ACCEPTED', 'REJECTED', 'IN_BATCH')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE batches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    public_code TEXT NOT NULL UNIQUE,
    owner_org_id UUID NOT NULL REFERENCES organisations(id),
    destination TEXT NOT NULL CHECK (destination IN ('domestic', 'export')),
    kg_net NUMERIC(6,2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'SAMPLED', 'AT_LAB', 'TEST_PASSED', 'TEST_FAILED', 'PACKAGING', 'TAGGED', 'ON_HOLD', 'RECALLED')),
    report_id UUID,
    event_head_hash TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    uid TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL CHECK (role IN ('sample', 'unit', 'bulk')),
    kind TEXT NOT NULL DEFAULT 'virtual' CHECK (kind IN ('virtual', 'ntag424')),
    state TEXT NOT NULL DEFAULT 'PROVISIONING' CHECK (state IN ('PROVISIONING', 'ACTIVE', 'SPOILED')),
    last_counter INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE units (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_id UUID NOT NULL REFERENCES batches(id),
    serial INTEGER NOT NULL,
    public_code TEXT NOT NULL UNIQUE,
    size_g INTEGER NOT NULL,
    tag_id UUID REFERENCES tags(id),
    status TEXT NOT NULL DEFAULT 'ISSUED' CHECK (status IN ('ISSUED', 'ACTIVE', 'SOLD', 'SPOILED', 'RECALLED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE custody_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_id UUID,
    subject_type TEXT NOT NULL,
    subject_id UUID NOT NULL,
    type TEXT NOT NULL,
    actor_user_id UUID,
    org_id UUID NOT NULL REFERENCES organisations(id),
    payload JSONB NOT NULL,
    prev_hash TEXT NOT NULL,
    event_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE anchors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    merkle_root TEXT NOT NULL,
    tx_hash TEXT NOT NULL,
    event_from_id UUID NOT NULL,
    event_to_id UUID NOT NULL,
    anchored_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ledger TEXT NOT NULL DEFAULT 'polygon_amoy'
);

CREATE TABLE scan_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tag_id UUID REFERENCES tags(id),
    public_code TEXT NOT NULL,
    mode TEXT NOT NULL CHECK (mode IN ('nfc', 'qr')),
    result TEXT NOT NULL,
    counter INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Attach append-only trigger
CREATE TRIGGER trg_harvest_records_append_only BEFORE UPDATE OR DELETE ON harvest_records FOR EACH ROW EXECUTE FUNCTION enforce_append_only();
CREATE TRIGGER trg_custody_events_append_only BEFORE UPDATE OR DELETE ON custody_events FOR EACH ROW EXECUTE FUNCTION enforce_append_only();
CREATE TRIGGER trg_telemetry_logs_append_only BEFORE UPDATE OR DELETE ON telemetry_logs FOR EACH ROW EXECUTE FUNCTION enforce_append_only();
CREATE TRIGGER trg_scan_events_append_only BEFORE UPDATE OR DELETE ON scan_events FOR EACH ROW EXECUTE FUNCTION enforce_append_only();
