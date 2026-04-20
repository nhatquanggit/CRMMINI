import { createAppointment, findAppointments } from '../models/appointment.model.js';

export const createNewAppointment = async (data, user) => {
  const appointmentData = {
    ...data,
    createdBy: user.id,
    assignedTo: data.assignedTo || user.id
  };
  return createAppointment(appointmentData);
};

export const getAppointments = async (filters, user) => {
  const where = { ...filters };
  if (user.role !== 'ADMIN') {
    where.userId = user.id;
  }
  return findAppointments(where);
};