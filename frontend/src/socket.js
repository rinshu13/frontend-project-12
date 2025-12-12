import { io } from 'socket.io-client';
import { store } from './store';
import { addMessage } from './features/messages/messagesSlice';

let socket = null;

export const connectSocket = (token) => {
  if (socket) return socket;

  const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'https://frontend-chat-ru.hexlet.app/chat';  // ИЗМЕНЕНО: Добавлен /chat для namespace (фиксит "Invalid namespace")

  socket = io(SOCKET_URL, {
    auth: { token },  // Токен для auth на сервере
    transports: ['websocket', 'polling'],  // Fallback на polling для стабильности
    timeout: 20000,  // Таймаут подключения
  });

  // Получение новых сообщений (реал-тайм)
  socket.on('newMessage', (message) => {
    store.dispatch(addMessage(message));  // Добавляем в Redux
  });

  // Ошибки
  socket.on('connect_error', (err) => {
    console.error('Socket connect error:', err.message || err);  // Улучшен лог для отладки
  });

  // Успешное подключение
  socket.on('connect', () => {
    console.log('Socket connected to:', SOCKET_URL);
  });

  // Отключение
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

// Промисификация emit
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

// Join channel
export const joinChannel = async (channelId) => {
  try {
    await promisifyEmit('joinChannel', { channelId });
    console.log('Joined channel:', channelId);
  } catch (error) {
    console.error('Join channel error:', error);
  }
};

// Leave channel
export const leaveChannel = async (channelId) => {
  try {
    await promisifyEmit('leaveChannel', { channelId });
    console.log('Left channel:', channelId);
  } catch (error) {
    console.error('Leave channel error:', error);
  }
};

// Emit newMessage
export const emitNewMessage = async (data) => {
  try {
    await promisifyEmit('newMessage', data);
    console.log('Message emitted:', data);
  } catch (error) {
    console.error('Emit message error:', error);
    throw error;
  }
};
