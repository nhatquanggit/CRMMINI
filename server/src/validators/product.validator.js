import { z } from 'zod';

const bodySchema = z.object({
  sku: z.string().min(2).max(50),
  name: z.string().min(2).max(180),
  category: z.string().max(120).optional().nullable(),
  unit: z.string().min(1).max(30).optional(),
  price: z.coerce.number().positive(),
  description: z.string().max(5000).optional().nullable(),
  isActive: z.boolean().optional()
});

export const listProductsSchema = z.object({
  body: z.any().optional(),
  params: z.any().optional(),
  query: z.object({
    search: z.string().max(255).optional(),
    category: z.string().max(120).optional(),
    isActive: z.union([z.literal('true'), z.literal('false')]).optional()
  }).partial().optional()
});

export const createProductSchema = z.object({
  body: bodySchema,
  params: z.any().optional(),
  query: z.any().optional()
});

export const updateProductSchema = z.object({
  body: bodySchema.partial(),
  params: z.object({ id: z.coerce.number().int().positive() }),
  query: z.any().optional()
});

export const idProductSchema = z.object({
  body: z.any().optional(),
  query: z.any().optional(),
  params: z.object({ id: z.coerce.number().int().positive() })
});
