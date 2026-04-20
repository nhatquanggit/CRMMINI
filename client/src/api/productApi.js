import api from './api';

export const getProductsApi = async (params = {}) => {
  const { data } = await api.get('/products', { params });
  return data.data;
};

export const getProductApi = async (id) => {
  const { data } = await api.get(`/products/${id}`);
  return data.data;
};

export const createProductApi = async (payload) => {
  const { data } = await api.post('/products', payload);
  return data.data;
};

export const updateProductApi = async (id, payload) => {
  const { data } = await api.put(`/products/${id}`, payload);
  return data.data;
};

export const deleteProductApi = async (id) => {
  const { data } = await api.delete(`/products/${id}`);
  return data.data;
};
