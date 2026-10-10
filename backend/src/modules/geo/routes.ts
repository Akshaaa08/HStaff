import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { wrap } from '../../utils/http';
import * as c from './controller';
import { etaQuery, searchQuery } from './schema';

export const geoRouter = Router();
geoRouter.use(authenticate);
geoRouter.get('/search', validate({ query: searchQuery }), wrap(c.search));
geoRouter.get('/eta', validate({ query: etaQuery }), wrap(c.eta));
