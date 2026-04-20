import { Router } from 'express';
import { protect } from '../middlewares/auth.middleware.js';
import validate from '../middlewares/validate.middleware.js';
import { askChatHandler } from '../controllers/chat.controller.js';
import { askChatSchema } from '../validators/chat.validator.js';

const router = Router();

router.use(protect);
router.post('/ask', validate(askChatSchema), askChatHandler);

export default router;
