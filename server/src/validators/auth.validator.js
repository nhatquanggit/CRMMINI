import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(120),
    email: z.string().email(),
    password: z.string().min(6).max(100)
  }),
  params: z.any().optional(),
  query: z.any().optional()
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(6).max(100)
  }),
  params: z.any().optional(),
  query: z.any().optional()
});
