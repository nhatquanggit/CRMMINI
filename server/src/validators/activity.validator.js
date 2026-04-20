import { z } from 'zod';

export const createActivitySchema = z.object({
  body: z.object({
    type: z.enum(['NOTE', 'CALL', 'EMAIL', 'MEETING', 'OTHER']),
    content: z.string().min(2).max(5000),
    customerId: z.coerce.number().int().positive().optional(),
    dealId: z.coerce.number().int().positive().optional()
  }).refine(
    (data) => data.customerId || data.dealId,
    { message: 'Either customerId or dealId must be provided' }
  ),
  params: z.any().optional(),
  query: z.any().optional()
});

export const updateActivitySchema = z.object({
  body: z.object({
    type: z.enum(['NOTE', 'CALL', 'EMAIL', 'MEETING', 'OTHER']).optional(),
    content: z.string().min(2).max(5000).optional()
  }),
  params: z.object({
    id: z.coerce.number().int().positive()
  }),
  query: z.any().optional()
});

export const getActivitySchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive()
  }),
  query: z.any().optional()
});

export const deleteActivitySchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive()
  }),
  query: z.any().optional()
});

export const listActivitiesSchema = z.object({
  body: z.any().optional(),
  params: z.any().optional(),
  query: z.object({
    customerId: z.coerce.number().int().positive().optional(),
    dealId: z.coerce.number().int().positive().optional(),
    type: z.enum(['NOTE', 'CALL', 'EMAIL', 'MEETING', 'OTHER']).optional(),
    fromDate: z.string().datetime().optional(),
    toDate: z.string().datetime().optional()
  })
});
