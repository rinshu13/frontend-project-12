import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  messages: [],
};

const messagesSlice = createSlice({
  name: 'messages',
  initialState,
  reducers: {
    setMessages: (state, action) => {
      // ✅ Гарантируем массив
      state.messages = Array.isArray(action.payload) ? action.payload : [];
    },
    addMessage: (state, action) => {
      // ✅ Добавляем только если это объект (сообщение)
      if (action.payload && typeof action.payload === 'object' && !Array.isArray(action.payload)) {
        state.messages.push(action.payload);
      }
    },
  },
});

export const { setMessages, addMessage } = messagesSlice.actions;
export default messagesSlice.reducer;
