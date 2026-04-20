import { z } from 'zod';

export const idParamSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive()
  }),
  body: z.any().optional(),
  query: z.any().optional()
});
