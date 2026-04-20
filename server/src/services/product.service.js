import ApiError from '../utils/apiError.js';
import {
  createProduct,
  deleteProduct,
  findProductById,
  listProducts,
  updateProduct
} from '../models/product.model.js';

const canManageProducts = (user) => user.role === 'ADMIN' || user.role === 'MANAGER';

export const getProducts = async (query = {}) => {
  const where = {
    search: query.search,
    category: query.category
  };
  if (query.isActive !== undefined) {
    where.isActive = query.isActive === true || query.isActive === 'true';
  }
  return listProducts(where);
};

export const getProductDetail = async (id) => {
  const product = await findProductById(id);
  if (!product) throw new ApiError(404, 'Product not found');
  return product;
};

export const createProductRecord = async (payload, currentUser) => {
  if (!canManageProducts(currentUser)) {
    throw new ApiError(403, 'Only ADMIN/MANAGER can create products');
  }
  return createProduct({ ...payload, createdBy: currentUser.id });
};

export const updateProductRecord = async (id, payload, currentUser) => {
  if (!canManageProducts(currentUser)) {
    throw new ApiError(403, 'Only ADMIN/MANAGER can update products');
  }

  const current = await findProductById(id);
  if (!current) throw new ApiError(404, 'Product not found');

  return updateProduct(id, payload);
};

export const deleteProductRecord = async (id, currentUser) => {
  if (!canManageProducts(currentUser)) {
    throw new ApiError(403, 'Only ADMIN/MANAGER can delete products');
  }

  const current = await findProductById(id);
  if (!current) throw new ApiError(404, 'Product not found');

  await deleteProduct(id);
};
