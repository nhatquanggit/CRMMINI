import { z } from 'zod';

export const askChatSchema = z.object({
  body: z.object({
    message: z.string().min(1).max(2000),
    page: z.string().max(80).optional(),
    path: z.string().max(255).optional()
  }),
  params: z.any().optional(),
  query: z.any().optional()
});
