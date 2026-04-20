import ApiError from '../utils/apiError.js';
import { findDealById } from '../models/deal.model.js';
import { findProductById } from '../models/product.model.js';
import {
  createInvoice,
  deleteInvoice,
  findInvoiceById,
  listInvoices,
  updateInvoice
} from '../models/invoice.model.js';

const isAdmin = (user) => user.role === 'ADMIN' || user.role === 'MANAGER';

const makeInvoiceNo = () => {
  const y = new Date().getFullYear();
  const rand = Math.floor(Math.random() * 90000) + 10000;
  return `INV-${y}-${rand}`;
};

const computeTotals = (items, discountPct = 0, taxPct = 0) => {
  const normalized = items.map((it) => {
    const quantity = Number(it.quantity || 0);
    const unitPrice = Number(it.unitPrice || 0);
    const lineTotal = Number((quantity * unitPrice).toFixed(2));
    return {
      productId: Number(it.productId),
      description: it.description || null,
      quantity,
      unitPrice,
      lineTotal
    };
  });

  const subtotal = Number(normalized.reduce((s, it) => s + it.lineTotal, 0).toFixed(2));
  const afterDiscount = subtotal * (1 - Number(discountPct || 0) / 100);
  const totalAmount = Number((afterDiscount * (1 + Number(taxPct || 0) / 100)).toFixed(2));

  return { items: normalized, subtotal, totalAmount };
};

const validateItems = async (items) => {
  if (!Array.isArray(items) || items.length === 0) {
    throw new ApiError(400, 'Invoice must include at least 1 item');
  }

  for (const item of items) {
    const product = await findProductById(item.productId);
    if (!product) throw new ApiError(404, `Product ${item.productId} not found`);
    if (!product.isActive) throw new ApiError(400, `Product ${product.name} is inactive`);
  }
};

export const getInvoices = async (query, currentUser) => {
  const where = {};
  if (!isAdmin(currentUser)) where.createdBy = currentUser.id;
  if (query.status) where.status = query.status;
  if (query.dealId) where.dealId = query.dealId;
  return listInvoices(where);
};

export const getInvoiceDetail = async (id, currentUser) => {
  const invoice = await findInvoiceById(id);
  if (!invoice) throw new ApiError(404, 'Invoice not found');
  if (!isAdmin(currentUser) && invoice.createdBy !== currentUser.id) throw new ApiError(403, 'Forbidden');
  return invoice;
};

export const createInvoiceRecord = async (payload, currentUser) => {
  const deal = await findDealById(payload.dealId);
  if (!deal) throw new ApiError(404, 'Deal not found');

  if (!isAdmin(currentUser) && deal.ownerId !== currentUser.id) {
    throw new ApiError(403, 'Forbidden');
  }

  await validateItems(payload.items);

  const { items, subtotal, totalAmount } = computeTotals(
    payload.items,
    payload.discountPct,
    payload.taxPct
  );

  return createInvoice({
    invoiceNo: makeInvoiceNo(),
    dealId: deal.id,
    customerId: deal.customerId,
    status: payload.status || 'DRAFT',
    subtotal,
    discountPct: Number(payload.discountPct || 0),
    taxPct: Number(payload.taxPct || 0),
    totalAmount,
    dueDate: payload.dueDate,
    notes: payload.notes,
    createdBy: currentUser.id,
    items
  });
};

export const updateInvoiceRecord = async (id, payload, currentUser) => {
  const current = await findInvoiceById(id);
  if (!current) throw new ApiError(404, 'Invoice not found');
  if (!isAdmin(currentUser) && current.createdBy !== currentUser.id) throw new ApiError(403, 'Forbidden');

  const patch = { ...payload };

  if (Array.isArray(payload.items) || payload.discountPct !== undefined || payload.taxPct !== undefined) {
    const items = Array.isArray(payload.items) ? payload.items : current.items;
    await validateItems(items);
    const { items: normalized, subtotal, totalAmount } = computeTotals(
      items,
      payload.discountPct ?? current.discountPct,
      payload.taxPct ?? current.taxPct
    );
    patch.items = normalized;
    patch.subtotal = subtotal;
    patch.totalAmount = totalAmount;
  }

  return updateInvoice(id, patch);
};

export const updateInvoiceStatus = async (id, status, currentUser) => {
  const current = await findInvoiceById(id);
  if (!current) throw new ApiError(404, 'Invoice not found');
  if (!isAdmin(currentUser) && current.createdBy !== currentUser.id) throw new ApiError(403, 'Forbidden');

  const patch = { status };
  if (status === 'PAID') patch.paidAt = new Date();
  return updateInvoice(id, patch);
};

export const deleteInvoiceRecord = async (id, currentUser) => {
  const current = await findInvoiceById(id);
  if (!current) throw new ApiError(404, 'Invoice not found');
  if (!isAdmin(currentUser) && current.createdBy !== currentUser.id) throw new ApiError(403, 'Forbidden');
  await deleteInvoice(id);
};
