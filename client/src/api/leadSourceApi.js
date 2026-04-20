import api from './api';

export const getLeadSourceStatsApi = async () => {
  const { data } = await api.get('/lead-sources/stats');
  return data.data;
};
