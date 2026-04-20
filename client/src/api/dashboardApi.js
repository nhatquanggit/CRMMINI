import api from './api';

export const getDashboardSummaryApi = async () => {
  const { data } = await api.get('/dashboard/summary');
  return data.data;
};

export const getRevenueByMonthApi = async () => {
  const { data } = await api.get('/dashboard/revenue-by-month');
  return data.data;
};

export const getDealStatusApi = async () => {
  const { data } = await api.get('/dashboard/deal-status');
  return data.data;
};

export const getDashboardActivitiesApi = async () => {
  const { data } = await api.get('/dashboard/activities');
  return data.data;
};

export const getDashboardApi = async () => {
  const [summary, revenueByMonth, dealStatus, activities] = await Promise.all([
    getDashboardSummaryApi(),
    getRevenueByMonthApi(),
    getDealStatusApi(),
    getDashboardActivitiesApi()
  ]);

  return {
    ...summary,
    revenueByMonth,
    dealStatus,
    activities
  };
};
