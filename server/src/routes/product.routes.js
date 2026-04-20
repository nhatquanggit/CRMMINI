import { Router } from 'express';
import { protect } from '../middlewares/auth.middleware.js';
import validate from '../middlewares/validate.middleware.js';
import {
  createProductHandler,
  deleteProductHandler,
  getProductHandler,
  listProductsHandler,
  updateProductHandler
} from '../controllers/product.controller.js';
import {
  createProductSchema,
  idProductSchema,
  listProductsSchema,
  updateProductSchema
} from '../validators/product.validator.js';

const router = Router();

router.use(protect);

router.get('/', validate(listProductsSchema), listProductsHandler);
router.get('/:id', validate(idProductSchema), getProductHandler);
router.post('/', validate(createProductSchema), createProductHandler);
router.put('/:id', validate(updateProductSchema), updateProductHandler);
router.delete('/:id', validate(idProductSchema), deleteProductHandler);

export default router;
