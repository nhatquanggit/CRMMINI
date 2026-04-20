import { z } from 'zod';

const customerBody = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  phone: z.string().min(8).max(30),
  company: z.string().min(2).max(180),
  status: z.enum(['NEW', 'CONTACTED', 'CONVERTED']).optional(),
  leadSource: z.enum(['WEBSITE', 'FACEBOOK', 'ZALO', 'REFERRAL', 'EVENT', 'ADS', 'OTHER']).optional(),
  assignedTo: z.coerce.number().int().positive().optional()
});

export const createCustomerSchema = z.object({
  body: customerBody,
  params: z.any().optional(),
  query: z.any().optional()
});

export const updateCustomerSchema = z.object({
  body: customerBody.partial(),
  params: z.object({ id: z.coerce.number().int().positive() }),
  query: z.any().optional()
});
