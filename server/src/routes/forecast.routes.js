import { Router } from 'express';
import { protect } from '../middlewares/auth.middleware.js';
import validate from '../middlewares/validate.middleware.js';
import {
  createSalesTargetHandler,
  deleteSalesTargetHandler,
  getForecastOverviewHandler,
  listSalesTargetsHandler,
  updateSalesTargetHandler
} from '../controllers/forecast.controller.js';
import {
  createSalesTargetSchema,
  forecastOverviewSchema,
  idSalesTargetSchema,
  listSalesTargetsSchema,
  updateSalesTargetSchema
} from '../validators/forecast.validator.js';

const router = Router();

router.use(protect);

router.get('/overview', validate(forecastOverviewSchema), getForecastOverviewHandler);
router.get('/targets', validate(listSalesTargetsSchema), listSalesTargetsHandler);
router.post('/targets', validate(createSalesTargetSchema), createSalesTargetHandler);
router.put('/targets/:id', validate(updateSalesTargetSchema), updateSalesTargetHandler);
router.delete('/targets/:id', validate(idSalesTargetSchema), deleteSalesTargetHandler);

export default router;
