// src/features/auth/authSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  token: localStorage.getItem('token') || null,
  username: localStorage.getItem('username') || null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    login: (state, action) => {
      const { token, username } = action.payload;
      // Защита: сохраняем только валидные строки
      if (token && typeof token === 'string' && username && typeof username === 'string') {
        state.token = token;
        state.username = username;
        localStorage.setItem('token', token);
        localStorage.setItem('username', username);
      } else {
        console.error('Invalid login payload:', action.payload);
      }
    },
    logout: (state) => {
      state.token = null;
      state.username = null;
      localStorage.removeItem('token');
      localStorage.removeItem('username');
    },
    // ИЗМЕНЕНО: Добавлен initAuth (для явной инициализации в store)
    initAuth: (state) => {
      const token = localStorage.getItem('token');
      const username = localStorage.getItem('username');
      if (token && username && !state.token) {  // Только если не инициализировано
        state.token = token;
        state.username = username;
      }
    },
  },
});

export const { login, logout, initAuth } = authSlice.actions;  // ИЗМЕНЕНО: Экспорт initAuth
export default authSlice.reducer;
