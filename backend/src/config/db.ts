import knex, { type Knex } from 'knex';
import { types } from 'pg';
import { env } from './env';

// bigserial ids (shift_events, admin_audit_log) come back as numbers. numeric stays a string on purpose:
// money must never pass through a float.
types.setTypeParser(20, (v) => Number(v));

export const db: Knex = knex({
  client: 'pg',
  connection: env.DATABASE_URL,
  pool: { min: 0, max: env.NODE_ENV === 'test' ? 5 : 10 },
});

export type Trx = Knex.Transaction;
export type DbOrTrx = Knex | Knex.Transaction;
export type RawBinding = Knex.RawBinding;
