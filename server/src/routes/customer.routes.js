import { Router } from 'express';
import { protect } from '../middlewares/auth.middleware.js';
import validate from '../middlewares/validate.middleware.js';
import {
  createCustomer,
  deleteCustomer,
  getCustomerList,
  updateCustomer
} from '../controllers/customer.controller.js';
import { idParamSchema } from '../validators/common.validator.js';
import { createCustomerSchema, updateCustomerSchema } from '../validators/customer.validator.js';

const router = Router();

router.use(protect);

router.get('/', getCustomerList);
router.post('/', validate(createCustomerSchema), createCustomer);
router.put('/:id', validate(updateCustomerSchema), updateCustomer);
router.delete('/:id', validate(idParamSchema), deleteCustomer);

export default router;
