import ApiError from '../utils/apiError.js';
import { findUserById } from '../models/user.model.js';
import {
  createCustomer,
  deleteCustomer,
  findCustomerById,
  listCustomers,
  updateCustomer
} from '../models/customer.model.js';

const isAdmin = (user) => user.role === 'ADMIN';

export const getCustomers = async (currentUser) => {
  const where = isAdmin(currentUser) ? {} : { assignedTo: currentUser.id };
  return listCustomers(where);
};

export const createCustomerRecord = async (payload, currentUser) => {
  const assignedTo = isAdmin(currentUser) ? payload.assignedTo || currentUser.id : currentUser.id;
  const assignee = await findUserById(assignedTo);
  if (!assignee) {
    throw new ApiError(404, 'Assigned user not found');
  }

  return createCustomer({ ...payload, assignedTo });
};

export const updateCustomerRecord = async (id, payload, currentUser) => {
  const customer = await findCustomerById(id);
  if (!customer) {
    throw new ApiError(404, 'Customer not found');
  }

  if (!isAdmin(currentUser) && customer.assignedTo !== currentUser.id) {
    throw new ApiError(403, 'Forbidden');
  }

  if (payload.assignedTo) {
    if (!isAdmin(currentUser)) {
      throw new ApiError(403, 'Only ADMIN can reassign customer');
    }
    const assignee = await findUserById(payload.assignedTo);
    if (!assignee) {
      throw new ApiError(404, 'Assigned user not found');
    }
  }

  return updateCustomer(id, payload);
};

export const deleteCustomerRecord = async (id, currentUser) => {
  const customer = await findCustomerById(id);
  if (!customer) {
    throw new ApiError(404, 'Customer not found');
  }

  if (!isAdmin(currentUser) && customer.assignedTo !== currentUser.id) {
    throw new ApiError(403, 'Forbidden');
  }

  await deleteCustomer(id);
};
