import { Router } from 'express';
import { protect } from '../middlewares/auth.middleware.js';
import validate from '../middlewares/validate.middleware.js';
import {
  createQuoteHandler,
  deleteQuoteHandler,
  getQuoteHandler,
  listQuotesHandler,
  updateQuoteHandler,
  updateQuoteStatusHandler
} from '../controllers/quote.controller.js';
import {
  createQuoteSchema,
  deleteQuoteSchema,
  getQuoteSchema,
  listQuotesSchema,
  updateQuoteSchema,
  updateQuoteStatusSchema
} from '../validators/quote.validator.js';

const router = Router();

router.use(protect);

router.get('/', validate(listQuotesSchema), listQuotesHandler);
router.get('/:id', validate(getQuoteSchema), getQuoteHandler);
router.post('/', validate(createQuoteSchema), createQuoteHandler);
router.put('/:id', validate(updateQuoteSchema), updateQuoteHandler);
router.patch('/:id/status', validate(updateQuoteStatusSchema), updateQuoteStatusHandler);
router.delete('/:id', validate(deleteQuoteSchema), deleteQuoteHandler);

export default router;
