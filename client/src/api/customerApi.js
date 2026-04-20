import api from './api';

export const getCustomersApi = async () => {
  const { data } = await api.get('/customers');
  return data.data;
};

export const createCustomerApi = async (payload) => {
  const { data } = await api.post('/customers', payload);
  return data.data;
};

export const updateCustomerApi = async (id, payload) => {
  const { data } = await api.put(`/customers/${id}`, payload);
  return data.data;
};

export const deleteCustomerApi = async (id) => {
  await api.delete(`/customers/${id}`);
};
