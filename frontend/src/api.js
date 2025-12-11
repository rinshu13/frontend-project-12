import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1',  // Прокси на сервер
});

// Interceptor: Автоматически добавляет токен из Redux (после логина)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');  // Или из Redux, но localStorage проще
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
