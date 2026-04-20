import { Router } from 'express';
import { protect } from '../middlewares/auth.middleware.js';
import validate from '../middlewares/validate.middleware.js';
import { createAppointment, getAllAppointments } from '../controllers/appointment.controller.js';
import { createAppointmentSchema } from '../validators/appointment.validator.js';

const router = Router();

router.use(protect);
router.post('/', validate(createAppointmentSchema), createAppointment);
router.get('/', getAllAppointments);

export default router;