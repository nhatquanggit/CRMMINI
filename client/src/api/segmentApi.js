import api from './api';

export const getSegmentsApi = async () => {
  const { data } = await api.get('/segments');
  return data.data;
};

export const getSegmentApi = async (id) => {
  const { data } = await api.get(`/segments/${id}`);
  return data.data;
};

export const getSegmentMembersApi = async (id) => {
  const { data } = await api.get(`/segments/${id}/members`);
  return data.data;
};

export const createSegmentApi = async (payload) => {
  const { data } = await api.post('/segments', payload);
  return data.data;
};

export const updateSegmentApi = async (id, payload) => {
  const { data } = await api.put(`/segments/${id}`, payload);
  return data.data;
};

export const deleteSegmentApi = async (id) => {
  const { data } = await api.delete(`/segments/${id}`);
  return data;
};
