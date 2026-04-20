import { z } from 'zod';

const statuses = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
const priorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

const bodySchema = z.object({
  subject: z.string().min(2).max(180),
  description: z.string().min(2).max(10000),
  status: z.enum(statuses).optional(),
  priority: z.enum(priorities).optional(),
  category: z.string().max(60).optional().nullable(),
  customerId: z.coerce.number().int().positive().optional().nullable(),
  assignedTo: z.coerce.number().int().positive().optional().nullable(),
  dueDate: z.string().datetime().optional().nullable(),
  resolvedAt: z.string().datetime().optional().nullable()
});

export const listSupportTicketsSchema = z.object({
  body: z.any().optional(),
  params: z.any().optional(),
  query: z.object({
    search: z.string().max(255).optional(),
    status: z.enum(statuses).optional(),
    priority: z.enum(priorities).optional(),
    assignedTo: z.coerce.number().int().positive().optional(),
    createdBy: z.coerce.number().int().positive().optional(),
    customerId: z.coerce.number().int().positive().optional()
  }).partial().optional()
});

export const idSupportTicketSchema = z.object({
  body: z.any().optional(),
  query: z.any().optional(),
  params: z.object({ id: z.coerce.number().int().positive() })
});

export const createSupportTicketSchema = z.object({
  body: bodySchema,
  query: z.any().optional(),
  params: z.any().optional()
});

export const updateSupportTicketSchema = z.object({
  body: bodySchema.partial(),
  query: z.any().optional(),
  params: z.object({ id: z.coerce.number().int().positive() })
});
