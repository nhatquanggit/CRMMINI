import asyncHandler from '../utils/asyncHandler.js';
import { createNewAppointment, getAppointments } from '../services/appointment.service.js';

export const createAppointment = asyncHandler(async (req, res) => {
  const appointment = await createNewAppointment(req.validated.body, req.user);
  res.status(201).json({ success: true, message: 'Appointment created', data: appointment });
});

export const getAllAppointments = asyncHandler(async (req, res) => {
  const appointments = await getAppointments(req.query, req.user);
  res.status(200).json({ success: true, data: appointments });
});