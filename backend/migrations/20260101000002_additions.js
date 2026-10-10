// Additions the TRD is silent on. Each one is recorded in docs/decisions.md (D-05 .. D-09).
exports.up = async (knex) => {
  await knex.raw(`
-- D-05: payout details collected by the prototype's helper sign-up (UPI ID, age)
ALTER TABLE worker_profiles ADD COLUMN upi_id text, ADD COLUMN age int;

-- D-06: admin review moderation needs a hidden flag (reviews table has none in section 7)
ALTER TABLE reviews ADD COLUMN hidden boolean NOT NULL DEFAULT false;

-- Data-integrity guards that the section 7 DDL leaves to the application
ALTER TABLE shifts ADD CONSTRAINT shifts_time_order CHECK (end_at > start_at);
ALTER TABLE shifts ADD CONSTRAINT shifts_mode_chk CHECK (mode IN ('DIRECT','OPEN'));
ALTER TABLE shifts ADD CONSTRAINT shifts_rate_chk CHECK (hourly_rate >= 0);
ALTER TABLE users ADD CONSTRAINT users_status_chk CHECK (status IN ('ACTIVE','SUSPENDED'));
ALTER TABLE payments ADD CONSTRAINT payments_status_chk CHECK (status IN ('CREATED','PAID','FAILED','REFUNDED'));
ALTER TABLE payments ADD CONSTRAINT payments_payout_chk CHECK (payout_status IN ('PENDING','SETTLED'));
ALTER TABLE timesheets ADD CONSTRAINT timesheets_status_chk CHECK (status IN ('PENDING','APPROVED','AUTO_APPROVED','DISPUTED'));
ALTER TABLE disputes ADD CONSTRAINT disputes_status_chk CHECK (status IN ('OPEN','IN_REVIEW','RESOLVED','ESCALATED'));

-- Exactly one successful payment per shift (makes /payments/verify idempotent under races)
CREATE UNIQUE INDEX payments_one_paid_per_shift ON payments(shift_id) WHERE status = 'PAID';
CREATE UNIQUE INDEX payments_provider_order_uidx ON payments(provider, provider_order_id);

CREATE INDEX shifts_client_idx ON shifts(client_id, created_at DESC);
CREATE INDEX shifts_worker_idx ON shifts(worker_id, start_at);
CREATE INDEX shifts_expiry_idx ON shifts(request_expires_at) WHERE status IN ('REQUESTED','OPEN');
CREATE INDEX shift_events_shift_idx ON shift_events(shift_id, id);
CREATE INDEX notifications_user_idx ON notifications(user_id, created_at DESC);
CREATE INDEX kyc_worker_idx ON kyc_documents(worker_id);
CREATE INDEX disputes_shift_idx ON disputes(shift_id);
CREATE INDEX reviews_reviewee_idx ON reviews(reviewee_id, created_at DESC);
CREATE INDEX audit_created_idx ON admin_audit_log(created_at DESC);

-- shift_events is an immutable audit log (section 7): reject UPDATE and DELETE at the database level
CREATE FUNCTION shift_events_immutable() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'shift_events is append-only';
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER shift_events_no_update BEFORE UPDATE OR DELETE ON shift_events
  FOR EACH ROW EXECUTE FUNCTION shift_events_immutable();
  `);
};

exports.down = async (knex) => {
  await knex.raw(`
DROP TRIGGER IF EXISTS shift_events_no_update ON shift_events;
DROP FUNCTION IF EXISTS shift_events_immutable();
DROP INDEX IF EXISTS audit_created_idx, reviews_reviewee_idx, disputes_shift_idx, kyc_worker_idx,
  notifications_user_idx, shift_events_shift_idx, shifts_expiry_idx, shifts_worker_idx, shifts_client_idx,
  payments_provider_order_uidx, payments_one_paid_per_shift;
ALTER TABLE disputes DROP CONSTRAINT IF EXISTS disputes_status_chk;
ALTER TABLE timesheets DROP CONSTRAINT IF EXISTS timesheets_status_chk;
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_payout_chk, DROP CONSTRAINT IF EXISTS payments_status_chk;
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_status_chk;
ALTER TABLE shifts DROP CONSTRAINT IF EXISTS shifts_rate_chk, DROP CONSTRAINT IF EXISTS shifts_mode_chk, DROP CONSTRAINT IF EXISTS shifts_time_order;
ALTER TABLE reviews DROP COLUMN IF EXISTS hidden;
ALTER TABLE worker_profiles DROP COLUMN IF EXISTS age, DROP COLUMN IF EXISTS upi_id;
  `);
};
