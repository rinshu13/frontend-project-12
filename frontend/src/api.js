import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',  // Prod: Hexlet, dev: прокси
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// POST /messages для отправки
export const sendMessage = async (data) => {
  return api.post('/messages', data);
};

// GET /messages?channelId=id для получения сообщений по каналу
export const fetchMessagesByChannel = async (channelId) => {
  return api.get(`/messages?channelId=${channelId}`);
};

// GET /channels для получения всех каналов
export const getChannels = async () => {
  return api.get('/channels');
};

// POST /channels для создания канала
export const createChannel = async (name) => {
  return api.post('/channels', {
    data: {
      type: 'channels',
      attributes: { name },
    },
  });
};

// DELETE /channels/:id для удаления канала
export const deleteChannel = async (channelId) => {
  return api.delete(`/channels/${channelId}`);
};

// PUT /channels/:id для переименования канала
export const renameChannel = async (channelId, name) => {
  return api.put(`/channels/${channelId}`, {
    data: {
      type: 'channels',
      attributes: { name },
    },
  });
};

export default api;
