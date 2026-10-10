import { z } from 'zod';
import { paginationQuery } from '../../utils/http';

export const listSchema = z.object(paginationQuery);
