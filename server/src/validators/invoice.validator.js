import { z } from 'zod';

const statuses = ['DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED'];

const itemSchema = z.object({
  productId: z.coerce.number().int().positive(),
  description: z.string().max(255).optional().nullable(),
  quantity: z.coerce.number().positive(),
  unitPrice: z.coerce.number().positive()
});

const bodySchema = z.object({
  dealId: z.coerce.number().int().positive(),
  status: z.enum(statuses).optional(),
  discountPct: z.coerce.number().min(0).max(100).optional(),
  taxPct: z.coerce.number().min(0).max(100).optional(),
  dueDate: z.string().datetime().optional(),
  notes: z.string().max(5000).optional().nullable(),
  items: z.array(itemSchema).min(1)
});

export const listInvoicesSchema = z.object({
  body: z.any().optional(),
  params: z.any().optional(),
  query: z.object({
    status: z.enum(statuses).optional(),
    dealId: z.coerce.number().int().positive().optional()
  }).partial().optional()
});

export const idInvoiceSchema = z.object({
  body: z.any().optional(),
  query: z.any().optional(),
  params: z.object({ id: z.coerce.number().int().positive() })
});

export const createInvoiceSchema = z.object({
  body: bodySchema,
  params: z.any().optional(),
  query: z.any().optional()
});

export const updateInvoiceSchema = z.object({
  body: bodySchema.partial(),
  params: z.object({ id: z.coerce.number().int().positive() }),
  query: z.any().optional()
});

export const updateInvoiceStatusSchema = z.object({
  body: z.object({ status: z.enum(statuses) }),
  params: z.object({ id: z.coerce.number().int().positive() }),
  query: z.any().optional()
});
