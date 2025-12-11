import { io } from 'socket.io-client';
import { store } from './store';
import { addMessage } from './features/messages/messagesSlice';

let socket = null;

export const connectSocket = (token) => {
  if (socket) return socket;

  socket = io('/', {  // Подключение к / (прокси на 5001)
    auth: { token },  // Токен для auth на сервере
  });

  // Получение новых сообщений
  socket.on('newMessage', (message) => {
    store.dispatch(addMessage(message));  // Добавь в Redux
  });

  // Ошибки
  socket.on('connect_error', (err) => {
    console.error('Socket connect error:', err);
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

// Промисификация emit (по подсказке)
export const promisifyEmit = (event, data) => {
  return new Promise((resolve, reject) => {
    socket.emit(event, data, (ack) => {
      if (ack && ack.error) {
        reject(new Error(ack.error));
      } else {
        resolve(ack);
      }
    });
  });
};

// Join channel room
export const joinChannel = async (channelId) => {
  try {
    await promisifyEmit('joinChannel', { channelId });
  } catch (error) {
    console.error('Join channel error:', error);
  }
};

// Leave channel room (для смены канала)
export const leaveChannel = async (channelId) => {
  try {
    await promisifyEmit('leaveChannel', { channelId });
  } catch (error) {
    console.error('Leave channel error:', error);
  }
};

// Emit newMessage с ack
export const emitNewMessage = async (data) => {
  try {
    await promisifyEmit('newMessage', data);
  } catch (error) {
    console.error('Emit message error:', error);
    throw error;  // Для retry в handleSubmit
  }
};
