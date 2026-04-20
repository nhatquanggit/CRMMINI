import { z } from 'zod';

const statusEnum = ['NEW', 'CONTACTED', 'CONVERTED'];
const sourceEnum = ['WEBSITE', 'FACEBOOK', 'ZALO', 'REFERRAL', 'EVENT', 'ADS', 'OTHER'];

const bodySchema = z.object({
  name: z.string().min(2).max(120),
  description: z.string().max(500).optional().nullable(),
  statusFilter: z.enum(statusEnum).optional().nullable(),
  sourceFilter: z.enum(sourceEnum).optional().nullable(),
  minDeals: z.coerce.number().int().min(0).optional().nullable(),
  minTotalDealValue: z.coerce.number().min(0).optional().nullable(),
  isVip: z.boolean().optional().nullable(),
  isActive: z.boolean().optional()
});

export const idSegmentSchema = z.object({
  body: z.any().optional(),
  query: z.any().optional(),
  params: z.object({ id: z.coerce.number().int().positive() })
});

export const createSegmentSchema = z.object({
  body: bodySchema,
  query: z.any().optional(),
  params: z.any().optional()
});

export const updateSegmentSchema = z.object({
  body: bodySchema.partial(),
  query: z.any().optional(),
  params: z.object({ id: z.coerce.number().int().positive() })
});
