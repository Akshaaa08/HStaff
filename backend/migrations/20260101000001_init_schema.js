// TRD section 7, verbatim. Do not edit: add a new migration instead (TRD section 19 rule 5).
exports.up = async (knex) => {
  await knex.raw(`
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE user_role AS ENUM ('client','worker','admin');
CREATE TYPE admin_role AS ENUM ('super_admin','verifier','finance','support');
CREATE TYPE verification_status AS ENUM ('PENDING','NEEDS_INFO','APPROVED','REJECTED');
CREATE TYPE shift_status AS ENUM ('OPEN','REQUESTED','ACCEPTED','EN_ROUTE','ARRIVED','IN_PROGRESS',
  'AWAITING_APPROVAL','APPROVED','PAID','DECLINED','EXPIRED','CANCELLED','DISPUTED');

CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role user_role NOT NULL,
  admin_role admin_role,
  phone text UNIQUE,
  email text UNIQUE, password_hash text,
  name text, photo_url text,
  status text NOT NULL DEFAULT 'ACTIVE',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE skills (
  id serial PRIMARY KEY, name text UNIQUE NOT NULL,
  active boolean DEFAULT true
);

CREATE TABLE worker_profiles (
  user_id uuid PRIMARY KEY REFERENCES users(id),
  bio text, experience_years int, hourly_rate numeric(10,2),
  equipment text, is_online boolean DEFAULT false,
  location geography(Point,4326), location_updated_at timestamptz,
  verification verification_status DEFAULT 'PENDING',
  verification_note text,
  rating_avg numeric(3,2) DEFAULT 0, rating_count int DEFAULT 0
);
CREATE INDEX worker_loc_gix ON worker_profiles USING gist(location);

CREATE TABLE worker_skills (
  worker_id uuid REFERENCES users(id), skill_id int REFERENCES skills(id),
  PRIMARY KEY (worker_id, skill_id)
);

CREATE TABLE kyc_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id uuid REFERENCES users(id), doc_type text, storage_key text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE shifts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES users(id),
  worker_id uuid REFERENCES users(id),
  skill_id int REFERENCES skills(id),
  mode text NOT NULL DEFAULT 'DIRECT',
  title text, description text, materials text,
  start_at timestamptz NOT NULL, end_at timestamptz NOT NULL,
  is_instant boolean DEFAULT false,
  address text, location geography(Point,4326) NOT NULL,
  hourly_rate numeric(10,2) NOT NULL,
  status shift_status NOT NULL,
  request_expires_at timestamptz,
  created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
);
CREATE INDEX shifts_loc_gix ON shifts USING gist(location);
CREATE INDEX shifts_status_idx ON shifts(status);

CREATE TABLE shift_events (
  id bigserial PRIMARY KEY, shift_id uuid REFERENCES shifts(id),
  actor_id uuid, event text NOT NULL,
  from_status shift_status, to_status shift_status,
  lat double precision, lng double precision, meta jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE timesheets (
  shift_id uuid PRIMARY KEY REFERENCES shifts(id),
  clock_in_at timestamptz, clock_out_at timestamptz,
  verified_minutes int, billable_minutes int,
  gross numeric(10,2), commission numeric(10,2), worker_payout numeric(10,2),
  approval_deadline timestamptz,
  status text DEFAULT 'PENDING'
);

CREATE TABLE payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_id uuid REFERENCES shifts(id), amount numeric(10,2),
  provider text, provider_order_id text, provider_payment_id text,
  status text DEFAULT 'CREATED',
  payout_status text DEFAULT 'PENDING',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_id uuid REFERENCES shifts(id), reviewer_id uuid, reviewee_id uuid,
  stars int CHECK (stars BETWEEN 1 AND 5), tags text[], comment text,
  reported boolean DEFAULT false, created_at timestamptz DEFAULT now(),
  UNIQUE (shift_id, reviewer_id)
);

CREATE TABLE disputes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_id uuid REFERENCES shifts(id), raised_by uuid REFERENCES users(id),
  reason text, evidence_urls text[], status text DEFAULT 'OPEN',
  resolution text, resolved_by uuid, created_at timestamptz DEFAULT now()
);

CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid REFERENCES users(id),
  title text, body text, data jsonb, read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
CREATE TABLE push_tokens (user_id uuid REFERENCES users(id), token text, PRIMARY KEY (user_id, token));

CREATE TABLE app_config (key text PRIMARY KEY, value text);
CREATE TABLE admin_audit_log (
  id bigserial PRIMARY KEY, admin_id uuid, action text, target_type text, target_id text,
  meta jsonb, created_at timestamptz DEFAULT now()
);
  `);
};

exports.down = async (knex) => {
  await knex.raw(`
DROP TABLE IF EXISTS admin_audit_log, app_config, push_tokens, notifications, disputes, reviews, payments,
  timesheets, shift_events, shifts, kyc_documents, worker_skills, worker_profiles, skills, users CASCADE;
DROP TYPE IF EXISTS shift_status, verification_status, admin_role, user_role;
  `);
};
