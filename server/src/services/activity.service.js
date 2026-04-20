import ApiError from '../utils/apiError.js';
import { findCustomerById } from '../models/customer.model.js';
import {
  createActivity,
  listActivities,
  findActivityById,
  updateActivity,
  deleteActivity
} from '../models/activity.model.js';

const isAdmin = (user) => user.role === 'ADMIN';
const isManager = (user) => user.role === 'MANAGER';

/**
 * Get activities with permission checks
 * - Admin: sees all activities
 * - Manager: sees activities of their team
 * - Sales: sees only their own activities + customer/deal they have access to
 */
export const getActivities = async (filters = {}, currentUser) => {
  const where = {};

  // Copy valid filter fields
  if (filters.customerId) where.customerId = filters.customerId;
  if (filters.dealId) where.dealId = filters.dealId;
  if (filters.type) where.type = filters.type;
  if (filters.fromDate) where.fromDate = filters.fromDate;
  if (filters.toDate) where.toDate = filters.toDate;

  // Permission checks
  if (!isAdmin(currentUser)) {
    // Only show activities from customers assigned to current user
    if (filters.customerId) {
      const customer = await findCustomerById(filters.customerId);
      if (!customer || customer.assignedTo !== currentUser.id) {
        throw new ApiError(403, 'Forbidden');
      }
    } else {
      // If no customerId filter, they should see only their own created activities
      where.createdBy = currentUser.id;
    }
  }

  return listActivities(where);
};

/**
 * Create activity with permission checks
 * Must be gacustomer or associated deal owner
 */
export const createActivityRecord = async (payload, currentUser) => {
  // Validate that customer or deal exists
  const { customerId, dealId } = payload;

  if (customerId) {
    const customer = await findCustomerById(customerId);
    if (!customer) {
      throw new ApiError(404, 'Customer not found');
    }
    // Check permission: must be assigned customer or admin
    if (!isAdmin(currentUser) && customer.assignedTo !== currentUser.id) {
      throw new ApiError(403, 'You do not have permission to create activity for this customer');
    }
  }

  if (dealId) {
    // TODO: Add dealById query or use Prisma here
    // For now, we'll add validation in the deal module
  }

  const activity = await createActivity({
    ...payload,
    createdBy: currentUser.id
  });

  return activity;
};

/**
 * Get single activity with permission check
 */
export const getActivityDetail = async (activityId, currentUser) => {
  const activity = await findActivityById(activityId);
  
  if (!activity) {
    throw new ApiError(404, 'Activity not found');
  }

  // Permission check
  if (!isAdmin(currentUser) && activity.createdBy !== currentUser.id) {
    const customer = activity.customer;
    if (!customer || customer.assignedTo !== currentUser.id) {
      throw new ApiError(403, 'Forbidden');
    }
  }

  return activity;
};

/**
 * Update activity - only creator or admin can update
 */
export const updateActivityRecord = async (activityId, payload, currentUser) => {
  const activity = await findActivityById(activityId);
  
  if (!activity) {
    throw new ApiError(404, 'Activity not found');
  }

  // Permission check: only creator or admin
  if (!isAdmin(currentUser) && activity.createdBy !== currentUser.id) {
    throw new ApiError(403, 'Only creator or admin can update activity');
  }

  return updateActivity(activityId, payload);
};

/**
 * Delete activity - only creator or admin can delete
 */
export const deleteActivityRecord = async (activityId, currentUser) => {
  const activity = await findActivityById(activityId);
  
  if (!activity) {
    throw new ApiError(404, 'Activity not found');
  }

  // Permission check: only creator or admin
  if (!isAdmin(currentUser) && activity.createdBy !== currentUser.id) {
    throw new ApiError(403, 'Only creator or admin can delete activity');
  }

  await deleteActivity(activityId);
};
