import ApiError from '../utils/apiError.js';
import { findUserById } from '../models/user.model.js';
import { findCustomerById } from '../models/customer.model.js';
import { createDeal, findDealById, listDeals, updateDeal } from '../models/deal.model.js';

const isAdmin = (user) => user.role === 'ADMIN';

export const getDeals = async (currentUser) => {
  const where = isAdmin(currentUser) ? {} : { ownerId: currentUser.id };
  const deals = await listDeals(where);
  return deals.map((deal) => ({ ...deal, value: Number(deal.value) }));
};

export const createDealRecord = async (payload, currentUser) => {
  const customer = await findCustomerById(payload.customerId);
  if (!customer) {
    throw new ApiError(404, 'Customer not found');
  }

  const ownerId = isAdmin(currentUser) ? payload.ownerId || currentUser.id : currentUser.id;
  const owner = await findUserById(ownerId);
  if (!owner) {
    throw new ApiError(404, 'Owner user not found');
  }

  const deal = await createDeal({ ...payload, ownerId });
  return { ...deal, value: Number(deal.value) };
};

export const updateDealRecord = async (id, payload, currentUser) => {
  const deal = await findDealById(id);
  if (!deal) {
    throw new ApiError(404, 'Deal not found');
  }

  if (!isAdmin(currentUser) && deal.ownerId !== currentUser.id) {
    throw new ApiError(403, 'Forbidden');
  }

  if (payload.customerId) {
    const customer = await findCustomerById(payload.customerId);
    if (!customer) {
      throw new ApiError(404, 'Customer not found');
    }
  }

  if (payload.ownerId) {
    if (!isAdmin(currentUser)) {
      throw new ApiError(403, 'Only ADMIN can reassign deal owner');
    }
    const owner = await findUserById(payload.ownerId);
    if (!owner) {
      throw new ApiError(404, 'Owner user not found');
    }
  }

  const updated = await updateDeal(id, payload);
  return { ...updated, value: Number(updated.value) };
};
