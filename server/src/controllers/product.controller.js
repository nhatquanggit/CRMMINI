import asyncHandler from '../utils/asyncHandler.js';
import {
  createProductRecord,
  deleteProductRecord,
  getProductDetail,
  getProducts,
  updateProductRecord
} from '../services/product.service.js';

export const listProductsHandler = asyncHandler(async (req, res) => {
  const products = await getProducts(req.validated?.query || req.query);
  res.status(200).json({ success: true, data: products });
});

export const getProductHandler = asyncHandler(async (req, res) => {
  const product = await getProductDetail(req.validated.params.id);
  res.status(200).json({ success: true, data: product });
});

export const createProductHandler = asyncHandler(async (req, res) => {
  const product = await createProductRecord(req.validated.body, req.user);
  res.status(201).json({ success: true, message: 'Product created', data: product });
});

export const updateProductHandler = asyncHandler(async (req, res) => {
  const product = await updateProductRecord(req.validated.params.id, req.validated.body, req.user);
  res.status(200).json({ success: true, message: 'Product updated', data: product });
});

export const deleteProductHandler = asyncHandler(async (req, res) => {
  await deleteProductRecord(req.validated.params.id, req.user);
  res.status(200).json({ success: true, message: 'Product deleted' });
});
