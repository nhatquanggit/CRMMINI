import { Router } from 'express';
import { protect } from '../middlewares/auth.middleware.js';
import validate from '../middlewares/validate.middleware.js';
import {
  createInvoiceHandler,
  deleteInvoiceHandler,
  getInvoiceHandler,
  listInvoicesHandler,
  updateInvoiceHandler,
  updateInvoiceStatusHandler
} from '../controllers/invoice.controller.js';
import {
  createInvoiceSchema,
  idInvoiceSchema,
  listInvoicesSchema,
  updateInvoiceSchema,
  updateInvoiceStatusSchema
} from '../validators/invoice.validator.js';

const router = Router();

router.use(protect);

router.get('/', validate(listInvoicesSchema), listInvoicesHandler);
router.get('/:id', validate(idInvoiceSchema), getInvoiceHandler);
router.post('/', validate(createInvoiceSchema), createInvoiceHandler);
router.put('/:id', validate(updateInvoiceSchema), updateInvoiceHandler);
router.patch('/:id/status', validate(updateInvoiceStatusSchema), updateInvoiceStatusHandler);
router.delete('/:id', validate(idInvoiceSchema), deleteInvoiceHandler);

export default router;
