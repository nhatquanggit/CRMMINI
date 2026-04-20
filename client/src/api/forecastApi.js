import api from './api';

export const getForecastOverviewApi = async (params = {}) => {
  const { data } = await api.get('/sales-forecasts/overview', { params });
  return data.data;
};

export const getSalesTargetsApi = async (params = {}) => {
  const { data } = await api.get('/sales-forecasts/targets', { params });
  return data.data;
};

export const createSalesTargetApi = async (payload) => {
  const { data } = await api.post('/sales-forecasts/targets', payload);
  return data.data;
};

export const updateSalesTargetApi = async (id, payload) => {
  const { data } = await api.put(`/sales-forecasts/targets/${id}`, payload);
  return data.data;
};

export const deleteSalesTargetApi = async (id) => {
  const { data } = await api.delete(`/sales-forecasts/targets/${id}`);
  return data.data;
};
