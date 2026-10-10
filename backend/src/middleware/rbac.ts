import type { RequestHandler } from 'express';
import type { AdminRole, UserRole } from '../shared/enums';
import { forbidden, unauthorized } from '../utils/errors';

export const requireRole =
  (...roles: UserRole[]): RequestHandler =>
  (req, _res, next) => {
    if (!req.user) return next(unauthorized());
    if (!roles.includes(req.user.role))
      return next(forbidden(`This action is for ${roles.join(' or ')} accounts`, 'WRONG_ROLE'));
    next();
  };

/** Admin sub-role gate. super_admin passes everything (TRD section 9 rule 11). */
export const requireAdminRole =
  (...allowed: AdminRole[]): RequestHandler =>
  (req, _res, next) => {
    if (!req.user) return next(unauthorized());
    if (req.user.role !== 'admin') return next(forbidden('Admin access required', 'WRONG_ROLE'));
    const sub = req.user.adminRole;
    if (sub === 'super_admin' || (sub && allowed.includes(sub))) return next();
    next(
      forbidden(
        `Requires admin role: ${['super_admin', ...allowed].join(' or ')}`,
        'INSUFFICIENT_ADMIN_ROLE',
      ),
    );
  };
