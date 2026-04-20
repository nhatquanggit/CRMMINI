import api from './api';

export const getDealsApi = async () => {
  const { data } = await api.get('/deals');
  return data.data;
};

export const createDealApi = async (payload) => {
  const { data } = await api.post('/deals', payload);
  return data.data;
};

export const updateDealApi = async (id, payload) => {
  const { data } = await api.put(`/deals/${id}`, payload);
  return data.data;
};
