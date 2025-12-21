import { configureStore } from '@reduxjs/toolkit'
import authReducer from './auth/authSlice'
import channelsReducer from './channels/channelsSlice'
import messagesReducer from './messages/messagesSlice'

export const store = configureStore({
  reducer: {
    channels: channelsReducer,
    messages: messagesReducer,
    auth: authReducer,
  },
})

// Инициализация auth из localStorage при старте
store.dispatch({ type: 'auth/initAuth' })
