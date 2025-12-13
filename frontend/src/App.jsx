import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import leoProfanity from 'leo-profanity';
import {
  sendMessage,
  fetchMessagesByChannel,
  getChannels,
} from './api';
import {
  connectSocket,
  disconnectSocket,
  joinChannel,
  leaveChannel,
  emitNewMessage,
} from './socket';
import {
  setChannels,
  setCurrentChannelId,
} from './features/channels/channelsSlice';
import { setMessages } from './features/messages/messagesSlice';
import { logout, initAuth } from './features/auth/authSlice';
import AddChannelModal from './components/AddChannelModal';
import RenameChannelModal from './components/RenameChannelModal';
import RemoveChannelModal from './components/RemoveChannelModal';
import './App.css';

// Инициализация leo-profanity с русским словарем (добавляем распространенные нецензурные слова)
leoProfanity.add([
  'блядь', 'блять', 'пизда', 'пиздец', 'пиздеть', 'хуй', 'хуи', 'хуё', 'хуя', 'ебать', 'ебаный', 'еби', 'ебло',
  'нахуй', 'похуй', 'захуй', 'охуеть', 'охуенный', 'пидор', 'пидорас', 'сука', 'суки', 'блядина',
  'долбоёб', 'уёбище', 'mudak', 'pidor', 'pizda', 'huy', 'ebat', 'blyad' // и транслит
]);

const App = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const inputRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Флаг для защиты от двойного монтирования в Strict Mode
  const hasInitialized = useRef(false);

  const { token, username } = useSelector((state) => state.auth);
  const { channels, currentChannelId } = useSelector((state) => state.channels);
  const messages = useSelector((state) => state.messages.messages) || [];

  const [messageText, setMessageText] = useState('');
  const [messageError, setMessageError] = useState(null);
  const [submitError, setSubmitError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(null);
  const [showRemoveModal, setShowRemoveModal] = useState(null);

  // Автоскролл к последнему сообщению
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    dispatch(initAuth());
  }, [dispatch]);

  const saveChannelsToStorage = useCallback((channelsList) => {
    if (token) localStorage.setItem('channels', JSON.stringify(channelsList));
  }, [token]);

  const loadChannelsFromStorage = useCallback(() => {
    const stored = localStorage.getItem('channels');
    if (!stored) return [];
    try {
      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, []);

  const getDemoMessages = useCallback((channelName) => [
    {
      id: Date.now() - 1000,
      text: `Добро пожаловать в канал #${channelName}!`,
      username: 'System',
      createdAt: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: Date.now(),
      text: 'Это демо-сообщение. Начните общение!',
      username: 'DemoUser',
      createdAt: new Date().toISOString(),
    },
  ], []);

  const saveMessagesToStorage = useCallback((channelId, messagesList) => {
    if (token) {
      localStorage.setItem(`messages_${channelId}`, JSON.stringify(messagesList));
    }
  }, [token]);

  const loadMessagesFromStorage = useCallback((channelId) => {
    const stored = localStorage.getItem(`messages_${channelId}`);
    if (!stored) return [];
    try {
      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, []);

  const loadChannelData = useCallback(
    async (channelIdToLoad) => {
      let msgs = loadMessagesFromStorage(channelIdToLoad);

      if (msgs.length === 0) {
        try {
          const response = await fetchMessagesByChannel(channelIdToLoad);
          msgs = response.data?.messages || [];
        } catch (err) {
          console.warn('API messages fetch failed, using demo', err);
        }

        if (msgs.length === 0) {
          const channel = channels.find((c) => c.id === channelIdToLoad);
          msgs = getDemoMessages(channel?.name || 'general');
        }

        saveMessagesToStorage(channelIdToLoad, msgs);
      }

      dispatch(setMessages(msgs));
    },
    [channels, dispatch, getDemoMessages, loadMessagesFromStorage, saveMessagesToStorage]
  );

 const refetchChannels = useCallback(
  async (options = { switchToNewChannel: false, newChannelId: null }) => {
    const { switchToNewChannel = false, newChannelId = null } = options;

    try {
      const response = await getChannels();
      const serverChannels = response.data?.channels || [];

      let finalChannels;

      if (serverChannels.length > 0) {
        finalChannels = serverChannels;
      } else {
        const storedChannels = loadChannelsFromStorage();
        finalChannels = storedChannels.length > 0
          ? storedChannels
          : [
              { id: 1, name: 'general', removable: false },
              { id: 2, name: 'random', removable: false },
            ];
      }

      // Обновляем Redux
      dispatch(setChannels(finalChannels));

      // Сохраняем в localStorage (только если есть токен)
      saveChannelsToStorage(finalChannels);

      // Определяем, на какой канал переключиться
      let targetChannelId;

      if (switchToNewChannel && newChannelId) {
        // Если только что создали канал — переключаемся на него
        targetChannelId = newChannelId;
      } else if (switchToNewChannel && !newChannelId) {
        // Альтернатива: переключиться на последний removable канал (самый новый пользовательский)
        const userChannels = finalChannels.filter((c) => c.removable);
        if (userChannels.length > 0) {
          targetChannelId = userChannels[userChannels.length - 1].id;
        }
      }

      // Если не указан новый — используем текущий или первый
      if (!targetChannelId) {
        targetChannelId = finalChannels.some((c) => c.id === currentChannelId)
          ? currentChannelId
          : finalChannels[0].id;
      }

      // Устанавливаем текущий канал и загружаем сообщения
      dispatch(setCurrentChannelId(targetChannelId));
      await loadChannelData(targetChannelId);

      // Присоединяемся к каналу через сокет
      joinChannel(targetChannelId);
    } catch (err) {
      console.error('Failed to fetch channels:', err);
      toast.error(t('toast.error.fetchChannels'));

      // Fallback: пытаемся загрузить из localStorage
      const fallbackChannels = loadChannelsFromStorage();
      if (fallbackChannels.length > 0) {
        dispatch(setChannels(fallbackChannels));
        saveChannelsToStorage(fallbackChannels);
        const fallbackId = fallbackChannels[0].id;
        dispatch(setCurrentChannelId(fallbackId));
        await loadChannelData(fallbackId);
        joinChannel(fallbackId);
      }
    }
  },
  [
    dispatch,
    currentChannelId,
    loadChannelsFromStorage,
    saveChannelsToStorage,
    loadChannelData,
    t,
  ]
);

  // Инициализация сокета и начальная загрузка — только один раз
  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    if (hasInitialized.current) {
      return; // Защита от двойного выполнения в Strict Mode
    }
    hasInitialized.current = true;

    const socket = connectSocket(token);

    socket.on('newMessage', (payload) => {
      if (payload.channelId === currentChannelId) {
        dispatch(setMessages([...messages, payload.message]));
      }
    });

    refetchChannels();

    return () => {
      hasInitialized.current = false;
      socket.off('newMessage');
      disconnectSocket();
    };
  }, [token, navigate, dispatch]); // Зависимости минимальны — нет цикла

  // Реакция на смену текущего канала
  useEffect(() => {
    if (!currentChannelId || !token) return;

    joinChannel(currentChannelId);
    loadChannelData(currentChannelId);
  }, [currentChannelId, token]);

  const handleChannelClick = (channelId) => {
    if (channelId === currentChannelId) return;
    dispatch(setCurrentChannelId(channelId));
  };

  const validateMessage = useCallback((text) => {
    if (!text?.trim()) return t('validation.messageRequired');
    if (text.trim().length > 500) return t('validation.messageTooLong');
    if (leoProfanity.check(text)) return t('validation.profanityDetected'); // Запрещаем полностью
    return null;
  }, [t]);

  const handleMessageChange = (e) => {
    const text = e.target.value;
    setMessageText(text);
    const error = validateMessage(text);
    setMessageError(error);

    // Предупреждение при вводе мата, но не автоматическая очистка
    if (leoProfanity.check(text)) {
      toast.warning(t('toast.warning.profanity'));
    }
  };

  const isMessageValid = () => messageText.trim() && !messageError && currentChannelId;

  const handleSubmit = async (e) => {
    e.preventDefault();

    const rawText = messageText.trim();
    if (!rawText) {
      setMessageError(t('validation.messageRequired'));
      return;
    }

    if (rawText.length > 500) {
      setMessageError(t('validation.messageTooLong'));
      return;
    }

    // ЦЕНЗУРИМ текст перед отправкой и отображением
    const censoredText = leoProfanity.clean(rawText);

    // Опционально: предупреждаем пользователя, если был мат
    if (censoredText !== rawText) {
      toast.warning(t('toast.warning.profanityCensored'));
    }

    try {
      // Отправляем уже цензурированный текст на сервер
      await sendMessage(currentChannelId, censoredText, username);

      // Эмитим в сокет тоже цензурированный
      await emitNewMessage({
        channelId: currentChannelId,
        message: { 
          text: censoredText, 
          username,
          createdAt: new Date().toISOString(), // если нужно
        },
      });

      // Очищаем поле
      setMessageText('');
      setMessageError(null);
      setSubmitError(null);
      inputRef.current?.focus();
    } catch (err) {
      console.error(err);
      const errorMsg = t('toast.error.sendMessage');
      setSubmitError(errorMsg);
      toast.error(errorMsg);
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
    toast.info(t('toast.info.logout'));
  };

  const closeModalsAndRefresh = async () => {
    setShowAddModal(false);
    setShowRenameModal(null);
    setShowRemoveModal(null);
    await refetchChannels();
  };

  if (!token) return null;

  return (
    <div className="app vh-100 d-flex flex-column">
      <div className="app-body d-flex flex-grow-1">
        <aside className="channels-sidebar">
          <div className="channels-header">
            <h5>{t('app.channelsTitle')}</h5>
            <button className="btn btn-success w-100 mb-2" onClick={() => setShowAddModal(true)}>
              {t('app.addChannel')}
            </button>
            <button className="btn btn-outline w-100" onClick={handleLogout}>
              {t('app.logout')}
            </button>
          </div>

          <div className="channels-list" role="list">
            {channels?.length > 0 ? (
              channels.map((channel) => (
                <div
                  key={channel.id}
                  role="listitem"
                  className={`channel-item ${currentChannelId === channel.id ? 'active' : ''}`}
                >
                  <button
                    type="button"
                    className="channel-button"
                    onClick={() => handleChannelClick(channel.id)}
                    aria-current={currentChannelId === channel.id ? 'true' : 'false'}
                  >
                    <span className="channel-name">#{channel.name}</span>
                  </button>

                  {channel.removable && (
                    <div className="channel-dropdown">
                      <button
                        type="button"
                        className="btn btn-link p-0 dropdown-toggle"
                        aria-label={t('dropdown.manageChannel')}
                      >
                        {t('dropdown.manageChannel')} {/* Это ключевой текст! */}
                      </button>
                      <div className="dropdown-menu">
                        <button
                          type="button"
                          className="dropdown-item"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowRenameModal(channel.id);
                          }}
                        >
                          {t('dropdown.rename')}
                        </button>
                        <button
                          type="button"
                          className="dropdown-item text-danger"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowRemoveModal(channel.id);
                          }}
                        >
                          {t('dropdown.remove')}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className="text-center text-muted">{t('app.loadingChannels')}</p>
            )}
          </div>
        </aside>

        <section className="chat-section d-flex flex-column">
          <div className="messages-area">
            {messages.length > 0 ? (
              messages.map((msg) => (
                <div key={msg.id} className="message-card">
                  <div className="message-header">
                    <strong>{msg.username}</strong>
                  </div>
                  <div className="message-body">{msg.text}</div>
                  <div className="message-footer">
                    {new Date(msg.createdAt).toLocaleString()}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-muted">{t('app.noMessages')}</p>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSubmit} className="message-form" noValidate>
            {submitError && <div className="alert alert-danger">{submitError}</div>}
            {messageError && <div className="alert alert-warning">{messageError}</div>}

            <div className="input-group">
              <input
                ref={inputRef}
                type="text"
                value={messageText}
                aria-label="Новое сообщение"
                onChange={handleMessageChange}
                placeholder={t('app.messagePlaceholder')}
                disabled={!currentChannelId}
                className="form-input"
                autoFocus
              />
              <button
                type="submit"
                disabled={!isMessageValid()}
                className="btn btn-primary"
              >
                {t('app.send')}
              </button>
            </div>
          </form>
        </section>
      </div>

      <AddChannelModal 
        isOpen={showAddModal} 
        onClose={(newChannelId) => closeModalsAndRefresh(newChannelId)} 
      />
      {showRenameModal && (
        <RenameChannelModal
          channel={channels.find((c) => c.id === showRenameModal)}
          isOpen={true}
          onClose={closeModalsAndRefresh}
        />
      )}
      {showRemoveModal && (
        <RemoveChannelModal
          channelId={showRemoveModal}
          isOpen={true}
          onClose={closeModalsAndRefresh}
        />
      )}
    </div>
  );
};

export default App;
