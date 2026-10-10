import type { RequestHandler } from 'express';
import { db } from '../config/db';
import { forbidden, unauthorized } from '../utils/errors';
import { verifyAccessToken } from '../modules/auth/tokens';
import type { AdminRole, UserRole } from '../shared/enums';

interface UserRow {
  id: string;
  role: UserRole;
  admin_role: AdminRole | null;
  status: string;
  name: string | null;
}

/** Validates the access JWT, then re-checks the user row so suspension takes effect immediately. */
export const authenticate: RequestHandler = async (req, _res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) throw unauthorized();
    const payload = verifyAccessToken(header.slice(7));
    const user = await db('users')
      .where({ id: payload.sub })
      .first<UserRow | undefined>('id', 'role', 'admin_role', 'status', 'name');
    if (!user) throw unauthorized('Account no longer exists');
    if (user.status !== 'ACTIVE') throw forbidden('This account is suspended', 'ACCOUNT_SUSPENDED');
    req.user = { id: user.id, role: user.role, adminRole: user.admin_role, name: user.name };
    next();
  } catch (err) {
    next(err);
  }
};
