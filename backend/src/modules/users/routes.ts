import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { uploadOne } from '../../middleware/upload';
import { validate } from '../../middleware/validate';
import { wrap } from '../../utils/http';
import * as c from './controller';
import { updateMeSchema } from './schema';

// Shared by clients and workers (name, email, photo). Worker-specific data lives under /workers/me.
export const usersRouter = Router();
usersRouter.use(authenticate);
usersRouter.get('/me', wrap(c.getMe));
usersRouter.put('/me', validate({ body: updateMeSchema }), wrap(c.updateMe));
usersRouter.post('/me/photo', uploadOne('photo'), wrap(c.uploadPhoto));
