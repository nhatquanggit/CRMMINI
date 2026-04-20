import ApiError from '../utils/apiError.js';
import { findUserById } from '../models/user.model.js';
import {
  createSalesTarget,
  deleteSalesTarget,
  findSalesTargetById,
  getForecastOverview,
  listForecastOwners,
  listSalesTargets,
  updateSalesTarget
} from '../models/forecast.model.js';

const canManageAll = (user) => user.role === 'ADMIN' || user.role === 'MANAGER';

const currentMonthKey = () => new Date().toISOString().slice(0, 7);

const ensureOwner = async (ownerId) => {
  const user = await findUserById(ownerId);
  if (!user) throw new ApiError(404, 'Owner not found');
  return user;
};

export const getSalesForecastDashboard = async (query, currentUser) => {
  const targetMonth = query.month || currentMonthKey();
  const ownerId = canManageAll(currentUser)
    ? (query.ownerId ? Number(query.ownerId) : undefined)
    : currentUser.id;

  const [rows, owners, targets] = await Promise.all([
    getForecastOverview({ ownerId, targetMonth }),
    canManageAll(currentUser) ? listForecastOwners() : Promise.resolve([currentUser]),
    listSalesTargets({ ownerId, targetMonth })
  ]);

  const summary = rows.reduce((acc, item) => {
    acc.totalTarget += item.targetValue;
    acc.totalWonRevenue += item.wonRevenue;
    acc.totalPipelineValue += item.pipelineValue;
    acc.totalWeightedForecast += item.weightedForecast;
    acc.totalOpenDeals += item.openDeals;
    return acc;
  }, {
    totalTarget: 0,
    totalWonRevenue: 0,
    totalPipelineValue: 0,
    totalWeightedForecast: 0,
    totalOpenDeals: 0
  });

  const likelyAchievement = summary.totalTarget > 0
    ? Number((((summary.totalWonRevenue + summary.totalWeightedForecast) / summary.totalTarget) * 100).toFixed(1))
    : 0;

  return {
    month: targetMonth,
    summary: {
      ...summary,
      gapToTarget: Math.max(0, summary.totalTarget - summary.totalWonRevenue),
      likelyAchievement
    },
    owners,
    forecasts: rows,
    targets
  };
};

export const getSalesTargets = async (query, currentUser) => {
  const where = {
    targetMonth: query.month
  };
  where.ownerId = canManageAll(currentUser)
    ? (query.ownerId ? Number(query.ownerId) : undefined)
    : currentUser.id;
  return listSalesTargets(where);
};

export const createSalesTargetRecord = async (payload, currentUser) => {
  const ownerId = canManageAll(currentUser) ? Number(payload.ownerId || currentUser.id) : currentUser.id;
  await ensureOwner(ownerId);

  return createSalesTarget({
    ownerId,
    targetMonth: payload.targetMonth || currentMonthKey(),
    targetValue: Number(payload.targetValue || 0),
    note: payload.note,
    createdBy: currentUser.id
  });
};

export const updateSalesTargetRecord = async (id, payload, currentUser) => {
  const current = await findSalesTargetById(id);
  if (!current) throw new ApiError(404, 'Sales target not found');
  if (!canManageAll(currentUser) && current.ownerId !== currentUser.id) {
    throw new ApiError(403, 'Forbidden');
  }

  if (payload.ownerId !== undefined) {
    const nextOwnerId = canManageAll(currentUser) ? Number(payload.ownerId) : currentUser.id;
    await ensureOwner(nextOwnerId);
    payload.ownerId = nextOwnerId;
  }

  if (payload.targetValue !== undefined) {
    payload.targetValue = Number(payload.targetValue);
  }

  return updateSalesTarget(id, payload);
};

export const deleteSalesTargetRecord = async (id, currentUser) => {
  const current = await findSalesTargetById(id);
  if (!current) throw new ApiError(404, 'Sales target not found');
  if (!canManageAll(currentUser) && current.ownerId !== currentUser.id) {
    throw new ApiError(403, 'Forbidden');
  }
  await deleteSalesTarget(id);
};
