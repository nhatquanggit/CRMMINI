import api from './api';

export const getAvatarApi = async () => {
  const { data } = await api.get('/avatar/me');
  return data.data;
};

export const uploadAvatarApi = async (file) => {
  const form = new FormData();
  form.append('avatar', file);

  const { data } = await api.post('/avatar/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });

  return data.data;
};

export const updateProfileApi = async (payload) => {
  const { data } = await api.put('/settings/profile', payload);
  return data.data;
};

export const changePasswordApi = async (payload) => {
  const { data } = await api.post('/settings/change-password', payload);
  return data.data;
};

export const logoutOtherSessionsApi = async () => {
  const { data } = await api.post('/settings/logout-other-sessions');
  return data.data;
};

export const deleteAccountApi = async () => {
  const { data } = await api.delete('/settings/account');
  return data.data;
};
