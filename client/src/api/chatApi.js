import api from './api';

export const askChatApi = async (payload) => {
  const { data } = await api.post('/chat/ask', payload);
  return data.data;
};
