import { io } from 'socket.io-client';
import { store } from './store';
import { addMessage } from './features/messages/messagesSlice';
import { setChannels, setCurrentChannelId } from './features/channels/channelsSlice';

let socket = null;

export const connectSocket = (token) => {
  if (socket) return socket;

  const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || '';

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket', 'polling'],
    timeout: 20000,
  });

  socket.on('newMessage', (payload) => {
    // payload: { id, body: text, channelId, username }
    store.dispatch(addMessage(payload));
  });

  socket.on('newChannel', (payload) => {
    // payload: { id, name, removable }
    const newChannel = {
      id: payload.id,
      name: payload.name,
      removable: payload.removable ?? true,
    };
    const currentChannels = store.getState().channels.channels;
    store.dispatch(setChannels([...currentChannels, newChannel]));
  });

  socket.on('renameChannel', (payload) => {
    // payload: { id, name, removable } — именно так в Hexlet backend
    const { id, name, removable } = payload;
    const currentChannels = store.getState().channels.channels;
    const updatedChannels = currentChannels.map((channel) =>
      channel.id === id ? { ...channel, name, removable: removable ?? true } : channel
    );
    store.dispatch(setChannels(updatedChannels));
  });

  socket.on('removeChannel', (payload) => {
    // payload: { id }
    const { id } = payload;
    const currentChannels = store.getState().channels.channels;
    const filteredChannels = currentChannels.filter((channel) => channel.id !== id);
    store.dispatch(setChannels(filteredChannels));

    // Если удалили текущий канал — переключаемся на #general (id = 1)
    const currentId = store.getState().channels.currentChannelId;
    if (currentId === id) {
      store.dispatch(setCurrentChannelId(1));
    }
  });

  socket.on('connect_error', (err) => {
    console.error('Socket connect error:', err.message);
  });

  socket.on('connect', () => {
    console.log('Socket connected successfully');
  });

  socket.on('disconnect', (reason) => {
    console.log('Socket disconnected:', reason);
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const promisifyEmit = (event, data) => {
  return new Promise((resolve, reject) => {
    if (!socket) {
      reject(new Error('Socket not connected'));
      return;
    }

    socket.emit(event, data, (ack) => {
      if (ack && ack.error) {
        reject(new Error(ack.error));
      } else {
        resolve(ack);
      }
    });
  });
};

export const joinChannel = async (channelId) => {
  try {
    await promisifyEmit('joinChannel', { channelId });
  } catch (error) {
    console.error('Join channel error:', error);
  }
};

export const leaveChannel = async (channelId) => {
  try {
    await promisifyEmit('leaveChannel', { channelId });
  } catch (error) {
    console.error('Leave channel error:', error);
  }
};

export const emitNewMessage = async (data) => {
  try {
    await promisifyEmit('newMessage', data);
  } catch (error) {
    console.error('Emit message error:', error);
    throw error;
  }
};
