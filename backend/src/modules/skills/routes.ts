import { Router } from 'express';
import { ok, wrap } from '../../utils/http';
import { listActiveSkills } from './service';

// Public: the sign-up and booking screens need the category list before the user has a session.
export const skillsRouter = Router();
skillsRouter.get(
  '/',
  wrap(async (_req, res) => ok(res, await listActiveSkills())),
);
