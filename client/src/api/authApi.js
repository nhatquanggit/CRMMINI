import api from './api';

export const loginApi = async (payload) => {
  const { data } = await api.post('/auth/login', payload);
  return data.data;
};

export const registerApi = async (payload) => {
  const { data } = await api.post('/auth/register', payload);
  return data.data;
};
