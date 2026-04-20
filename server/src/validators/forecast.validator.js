import { z } from 'zod';

const monthRegex = /^\d{4}-\d{2}$/;

const bodySchema = z.object({
  ownerId: z.coerce.number().int().positive().optional(),
  targetMonth: z.string().regex(monthRegex).optional(),
  targetValue: z.coerce.number().min(0),
  note: z.string().max(500).optional().nullable()
});

export const forecastOverviewSchema = z.object({
  body: z.any().optional(),
  params: z.any().optional(),
  query: z.object({
    month: z.string().regex(monthRegex).optional(),
    ownerId: z.coerce.number().int().positive().optional()
  }).partial().optional()
});

export const listSalesTargetsSchema = z.object({
  body: z.any().optional(),
  params: z.any().optional(),
  query: z.object({
    month: z.string().regex(monthRegex).optional(),
    ownerId: z.coerce.number().int().positive().optional()
  }).partial().optional()
});

export const createSalesTargetSchema = z.object({
  body: bodySchema,
  params: z.any().optional(),
  query: z.any().optional()
});

export const updateSalesTargetSchema = z.object({
  body: bodySchema.partial(),
  params: z.object({ id: z.coerce.number().int().positive() }),
  query: z.any().optional()
});

export const idSalesTargetSchema = z.object({
  body: z.any().optional(),
  query: z.any().optional(),
  params: z.object({ id: z.coerce.number().int().positive() })
});
