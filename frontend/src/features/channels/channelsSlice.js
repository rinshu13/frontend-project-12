import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  channels: [],
  currentChannelId: null,
};

const channelsSlice = createSlice({
  name: 'channels',
  initialState,
  reducers: {
    setChannels: (state, action) => {
      state.channels = action.payload;
    },
    setCurrentChannelId: (state, action) => {
      state.currentChannelId = action.payload;
    },
  },
});

export const { setChannels, setCurrentChannelId } = channelsSlice.actions;
export default channelsSlice.reducer;
