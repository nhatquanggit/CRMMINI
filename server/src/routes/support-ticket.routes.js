import { Router } from 'express';
import { protect } from '../middlewares/auth.middleware.js';
import validate from '../middlewares/validate.middleware.js';
import {
  createSupportTicketHandler,
  deleteSupportTicketHandler,
  getSupportTicketHandler,
  listSupportTicketsHandler,
  updateSupportTicketHandler
} from '../controllers/support-ticket.controller.js';
import {
  createSupportTicketSchema,
  idSupportTicketSchema,
  listSupportTicketsSchema,
  updateSupportTicketSchema
} from '../validators/support-ticket.validator.js';

const router = Router();

router.use(protect);

router.get('/', validate(listSupportTicketsSchema), listSupportTicketsHandler);
router.get('/:id', validate(idSupportTicketSchema), getSupportTicketHandler);
router.post('/', validate(createSupportTicketSchema), createSupportTicketHandler);
router.put('/:id', validate(updateSupportTicketSchema), updateSupportTicketHandler);
router.delete('/:id', validate(idSupportTicketSchema), deleteSupportTicketHandler);

export default router;
