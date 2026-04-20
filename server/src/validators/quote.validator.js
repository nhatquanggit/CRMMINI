import { z } from 'zod';

const statuses = ['DRAFT', 'SENT', 'APPROVED', 'REJECTED', 'EXPIRED', 'SIGNED'];

const quoteBody = z.object({
  title: z.string().min(2).max(180),
  dealId: z.coerce.number().int().positive(),
  amount: z.coerce.number().positive(),
  discountPct: z.coerce.number().min(0).max(100).optional(),
  taxPct: z.coerce.number().min(0).max(100).optional(),
  status: z.enum(statuses).optional(),
  validUntil: z.string().datetime().optional(),
  terms: z.string().max(5000).optional()
});

export const listQuotesSchema = z.object({
  body: z.any().optional(),
  params: z.any().optional(),
  query: z.object({
    dealId: z.coerce.number().int().positive().optional(),
    status: z.enum(statuses).optional()
  }).partial().optional()
});

export const getQuoteSchema = z.object({
  body: z.any().optional(),
  query: z.any().optional(),
  params: z.object({ id: z.coerce.number().int().positive() })
});

export const createQuoteSchema = z.object({
  body: quoteBody,
  params: z.any().optional(),
  query: z.any().optional()
});

export const updateQuoteSchema = z.object({
  body: quoteBody.partial(),
  params: z.object({ id: z.coerce.number().int().positive() }),
  query: z.any().optional()
});

export const updateQuoteStatusSchema = z.object({
  body: z.object({ status: z.enum(statuses) }),
  params: z.object({ id: z.coerce.number().int().positive() }),
  query: z.any().optional()
});

export const deleteQuoteSchema = z.object({
  body: z.any().optional(),
  query: z.any().optional(),
  params: z.object({ id: z.coerce.number().int().positive() })
});
