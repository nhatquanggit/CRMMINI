import asyncHandler from '../utils/asyncHandler.js';
import {
  createCustomerRecord,
  deleteCustomerRecord,
  getCustomers,
  updateCustomerRecord
} from '../services/customer.service.js';

export const getCustomerList = asyncHandler(async (req, res) => {
  const customers = await getCustomers(req.user);
  res.status(200).json({ success: true, data: customers });
});

export const createCustomer = asyncHandler(async (req, res) => {
  const customer = await createCustomerRecord(req.validated.body, req.user);
  res.status(201).json({ success: true, message: 'Customer created', data: customer });
});

export const updateCustomer = asyncHandler(async (req, res) => {
  const id = req.validated.params.id;
  const customer = await updateCustomerRecord(id, req.validated.body, req.user);
  res.status(200).json({ success: true, message: 'Customer updated', data: customer });
});

export const deleteCustomer = asyncHandler(async (req, res) => {
  const id = req.validated.params.id;
  await deleteCustomerRecord(id, req.user);
  res.status(200).json({ success: true, message: 'Customer deleted' });
});
