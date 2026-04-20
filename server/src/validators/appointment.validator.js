import { z } from 'zod';

const dateTimeString = z.string().refine(
  (value) => !Number.isNaN(new Date(value).getTime()),
  { message: 'Invalid datetime value' }
);

export const createAppointmentSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required'),
    description: z.string().optional(),
    startTime: dateTimeString,
    endTime: dateTimeString,
    location: z.string().optional(),
    customerId: z.coerce.number().int().positive().optional(),
    dealId: z.coerce.number().int().positive().optional(),
    assignedTo: z.coerce.number().int().positive().optional(),
    remindAt: dateTimeString.optional(),
    type: z.enum(['APPOINTMENT', 'MEETING']).optional()
  }).refine(
    (data) => new Date(data.endTime).getTime() > new Date(data.startTime).getTime(),
    { message: 'End time must be after start time', path: ['endTime'] }
  ),
  params: z.any().optional(),
  query: z.any().optional()
});