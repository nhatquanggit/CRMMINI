import { Router } from 'express';
import { protect } from '../middlewares/auth.middleware.js';
import validate from '../middlewares/validate.middleware.js';
import { createDeal, getDealList, updateDeal } from '../controllers/deal.controller.js';
import { createDealSchema, updateDealSchema } from '../validators/deal.validator.js';

const router = Router();

router.use(protect);

router.get('/', getDealList);
router.post('/', validate(createDealSchema), createDeal);
router.put('/:id', validate(updateDealSchema), updateDeal);

export default router;
