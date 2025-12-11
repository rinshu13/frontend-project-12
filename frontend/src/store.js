import { configureStore } from '@reduxjs/toolkit';
import authReducer from './features/auth/authSlice';
import channelsReducer from './features/channels/channelsSlice';
import messagesReducer from './features/messages/messagesSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    channels: channelsReducer,
    messages: messagesReducer,
  },
});
