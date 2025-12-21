import { configureStore } from '@reduxjs/toolkit'
import authReducer from './auth/authSlice'
import channelsReducer from './channels/channelsSlice'
import messagesReducer from './messages/messagesSlice'

const store = configureStore({
  reducer: {
    auth: authReducer,
    channels: channelsReducer,
    messages: messagesReducer,
  },
})

// Инициализация auth из localStorage при старте
store.dispatch({ type: 'auth/initAuth' })

export default store
