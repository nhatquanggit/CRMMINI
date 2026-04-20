import { Router } from 'express';
import { protect } from '../middlewares/auth.middleware.js';
import validate from '../middlewares/validate.middleware.js';
import {
  createSegmentHandler,
  deleteSegmentHandler,
  getSegmentHandler,
  getSegmentMembersHandler,
  listSegmentsHandler,
  updateSegmentHandler
} from '../controllers/segment.controller.js';
import {
  createSegmentSchema,
  idSegmentSchema,
  updateSegmentSchema
} from '../validators/segment.validator.js';

const router = Router();

router.use(protect);

router.get('/', listSegmentsHandler);
router.get('/:id', validate(idSegmentSchema), getSegmentHandler);
router.get('/:id/members', validate(idSegmentSchema), getSegmentMembersHandler);
router.post('/', validate(createSegmentSchema), createSegmentHandler);
router.put('/:id', validate(updateSegmentSchema), updateSegmentHandler);
router.delete('/:id', validate(idSegmentSchema), deleteSegmentHandler);

export default router;
