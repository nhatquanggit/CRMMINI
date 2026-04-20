import { z } from 'zod';

const dealBody = z.object({
  title: z.string().min(2).max(180),
  value: z.coerce.number().positive(),
  stage: z.enum(['LEAD', 'CONTACTED', 'NEGOTIATION', 'WON', 'LOST']).optional(),
  customerId: z.coerce.number().int().positive(),
  ownerId: z.coerce.number().int().positive().optional()
});

export const createDealSchema = z.object({
  body: dealBody,
  params: z.any().optional(),
  query: z.any().optional()
});

export const updateDealSchema = z.object({
  body: dealBody.partial(),
  params: z.object({ id: z.coerce.number().int().positive() }),
  query: z.any().optional()
});
