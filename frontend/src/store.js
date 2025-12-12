import { configureStore } from '@reduxjs/toolkit';
import channelsReducer from './features/channels/channelsSlice';
import messagesReducer from './features/messages/messagesSlice';
import authReducer from './features/auth/authSlice';  // ← Импорт auth

export const store = configureStore({
  reducer: {
    channels: channelsReducer,
    messages: messagesReducer,
    auth: authReducer,  // ← Добавьте auth
  },
});

// Инициализация auth из localStorage при старте (после создания store)
store.dispatch({ type: 'auth/initAuth' });  // ← Используйте string action type, если импорт не работает; или импортируйте initAuth
