import { z } from 'zod';

export const createTaskSchema = z.object({
  body: z.object({
    title: z.string().min(3).max(255),
    description: z.string().min(5).max(5000),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional().default('MEDIUM'),
    customerId: z.coerce.number().int().positive().optional(),
    dealId: z.coerce.number().int().positive().optional(),
    assignedTo: z.coerce.number().int().positive(),
    dueDate: z.string().datetime(),
    remindAt: z.string().datetime().optional()
  }).refine(
    (data) => data.customerId || data.dealId || true, // Can be standalone
    { message: 'Task must be attached to customer or deal, or be standalone' }
  ),
  params: z.any().optional(),
  query: z.any().optional()
});

export const updateTaskSchema = z.object({
  body: z.object({
    title: z.string().min(3).max(255).optional(),
    description: z.string().min(5).max(5000).optional(),
    status: z.enum(['TODO', 'IN_PROGRESS', 'DONE', 'CANCELLED']).optional(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
    dueDate: z.string().datetime().optional(),
    assignedTo: z.coerce.number().int().positive().optional()
  }),
  params: z.object({
    id: z.coerce.number().int().positive()
  }),
  query: z.any().optional()
});

export const getTaskSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive()
  }),
  query: z.any().optional()
});

export const deleteTaskSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive()
  }),
  query: z.any().optional()
});

export const listTasksSchema = z.object({
  body: z.any().optional(),
  params: z.any().optional(),
  query: z.object({
    customerId: z.coerce.number().int().positive().optional(),
    dealId: z.coerce.number().int().positive().optional(),
    assignedTo: z.coerce.number().int().positive().optional(),
    status: z.enum(['TODO', 'IN_PROGRESS', 'DONE', 'CANCELLED']).optional(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
    fromDate: z.string().datetime().optional(),
    toDate: z.string().datetime().optional(),
    isOverdue: z.enum(['true', 'false']).optional(),
    orderBy: z.string().optional()
  })
});

export const updateTaskStatusSchema = z.object({
  body: z.object({
    status: z.enum(['TODO', 'IN_PROGRESS', 'DONE', 'CANCELLED'])
  }),
  params: z.object({
    id: z.coerce.number().int().positive()
  }),
  query: z.any().optional()
});
