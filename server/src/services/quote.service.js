import ApiError from '../utils/apiError.js';
import { findDealById } from '../models/deal.model.js';
import {
  createQuote,
  deleteQuote,
  findQuoteById,
  listQuotes,
  updateQuote
} from '../models/quote.model.js';

const isAdmin = (user) => user.role === 'ADMIN' || user.role === 'MANAGER';

const calcFinal = ({ amount, discountPct = 0, taxPct = 0 }) => {
  const base = Number(amount || 0);
  const afterDiscount = base * (1 - Number(discountPct || 0) / 100);
  const final = afterDiscount * (1 + Number(taxPct || 0) / 100);
  return Math.max(0, Number(final.toFixed(2)));
};

const buildQuoteNo = () => {
  const y = new Date().getFullYear();
  const rand = Math.floor(Math.random() * 90000) + 10000;
  return `Q-${y}-${rand}`;
};

export const getQuotes = async (query, currentUser) => {
  const where = {};
  if (!isAdmin(currentUser)) where.createdBy = currentUser.id;
  if (query.dealId) where.dealId = query.dealId;
  if (query.status) where.status = query.status;
  return listQuotes(where);
};

export const getQuoteDetail = async (id, currentUser) => {
  const quote = await findQuoteById(id);
  if (!quote) throw new ApiError(404, 'Quote not found');
  if (!isAdmin(currentUser) && quote.createdBy !== currentUser.id) throw new ApiError(403, 'Forbidden');
  return quote;
};

export const createQuoteRecord = async (payload, currentUser) => {
  const deal = await findDealById(payload.dealId);
  if (!deal) throw new ApiError(404, 'Deal not found');

  if (!isAdmin(currentUser) && deal.ownerId !== currentUser.id) {
    throw new ApiError(403, 'Forbidden');
  }

  const amount = Number(payload.amount);
  const discountPct = Number(payload.discountPct || 0);
  const taxPct = Number(payload.taxPct || 0);
  const finalAmount = calcFinal({ amount, discountPct, taxPct });

  return createQuote({
    quoteNo: buildQuoteNo(),
    title: payload.title,
    dealId: payload.dealId,
    customerId: deal.customerId,
    amount,
    discountPct,
    taxPct,
    finalAmount,
    status: payload.status || 'DRAFT',
    validUntil: payload.validUntil,
    terms: payload.terms,
    createdBy: currentUser.id
  });
};

export const updateQuoteRecord = async (id, payload, currentUser) => {
  const current = await findQuoteById(id);
  if (!current) throw new ApiError(404, 'Quote not found');

  if (!isAdmin(currentUser) && current.createdBy !== currentUser.id) {
    throw new ApiError(403, 'Forbidden');
  }

  const next = {
    ...payload,
    finalAmount: calcFinal({
      amount: payload.amount ?? current.amount,
      discountPct: payload.discountPct ?? current.discountPct,
      taxPct: payload.taxPct ?? current.taxPct
    })
  };

  return updateQuote(id, next);
};

export const updateQuoteStatus = async (id, status, currentUser) => {
  const current = await findQuoteById(id);
  if (!current) throw new ApiError(404, 'Quote not found');

  if (!isAdmin(currentUser) && current.createdBy !== currentUser.id) {
    throw new ApiError(403, 'Forbidden');
  }

  const patch = { status };
  if (status === 'SIGNED') patch.signedAt = new Date();
  return updateQuote(id, patch);
};

export const deleteQuoteRecord = async (id, currentUser) => {
  const current = await findQuoteById(id);
  if (!current) throw new ApiError(404, 'Quote not found');

  if (!isAdmin(currentUser) && current.createdBy !== currentUser.id) {
    throw new ApiError(403, 'Forbidden');
  }

  await deleteQuote(id);
};
