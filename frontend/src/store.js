import { configureStore } from '@reduxjs/toolkit'
import channelsReducer from './features/channels/channelsSlice'
import messagesReducer from './features/messages/messagesSlice'
import authReducer from './features/auth/authSlice'

export const store = configureStore({
  reducer: {
    channels: channelsReducer,
    messages: messagesReducer,
    auth: authReducer,
  },
})

// Инициализация auth из localStorage при старте
store.dispatch({ type: 'auth/initAuth' })
