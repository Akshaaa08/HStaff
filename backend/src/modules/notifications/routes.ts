import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { idParam, wrap } from '../../utils/http';
import * as c from './controller';
import { listSchema } from './schema';

export const notificationsRouter = Router();
notificationsRouter.use(authenticate);
notificationsRouter.get('/', validate({ query: listSchema }), wrap(c.list));
notificationsRouter.post('/read-all', wrap(c.readAll));
notificationsRouter.post('/:id/read', validate({ params: idParam }), wrap(c.read));
