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

const App = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const inputRef = useRef(null);
  const messagesEndRef = useRef(null); // для автоскролла

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

  // Загрузка каналов и сообщений
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

  const refetchChannels = useCallback(async () => {
    try {
      const response = await getChannels();
      const serverChannels = response.data?.channels || [];
      const channelsToUse = serverChannels.length > 0 ? serverChannels : loadChannelsFromStorage();

      const finalChannels =
        channelsToUse.length > 0
          ? channelsToUse
          : [
              { id: 1, name: 'general', removable: false },
              { id: 2, name: 'random', removable: false },
            ];

      dispatch(setChannels(finalChannels));
      saveChannelsToStorage(finalChannels);

      const validCurrentId = finalChannels.some((c) => c.id === currentChannelId)
        ? currentChannelId
        : finalChannels[0].id;

      dispatch(setCurrentChannelId(validCurrentId));
      joinChannel(validCurrentId);
      await loadChannelData(validCurrentId);
    } catch (err) {
      toast.error(t('toast.error.fetchChannels'));
    }
  }, [
    dispatch,
    currentChannelId,
    loadChannelsFromStorage,
    saveChannelsToStorage,
    loadChannelData,
    t,
  ]);

  // Основной эффект при монтировании
  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    const socket = connectSocket(token);

    // Прослушка новых сообщений от других пользователей
    socket.on('newMessage', (payload) => {
      if (payload.channelId === currentChannelId) {
        dispatch(setMessages([...messages, payload.message]));
      }
    });

    refetchChannels();

    return () => {
      socket.off('newMessage');
      disconnectSocket();
    };
  }, [token, navigate, dispatch, currentChannelId, refetchChannels]);

  // Переключение канала
  const handleChannelClick = useCallback(
    async (channelId) => {
      if (channelId === currentChannelId) return;

      if (currentChannelId) leaveChannel(currentChannelId);
      dispatch(setCurrentChannelId(channelId));
      joinChannel(channelId);
      await loadChannelData(channelId);
    },
    [currentChannelId, dispatch, loadChannelData]
  );

  const validateMessage = useCallback((text) => {
    if (!text?.trim()) return t('validation.messageRequired');
    if (text.trim().length > 500) return t('validation.messageTooLong');
    if (leoProfanity.check(text)) return t('validation.profanityDetected');
    return null;
  }, [t]);

  const handleMessageChange = (e) => {
    const text = e.target.value;
    setMessageText(text);
    setMessageError(validateMessage(text));

    if (leoProfanity.check(text)) {
      const cleaned = leoProfanity.clean(text);
      setMessageText(cleaned);
      toast.warning(t('toast.warning.profanity'));
    }
  };

  const isMessageValid = () => messageText.trim() && !messageError && currentChannelId;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const error = validateMessage(messageText);
    if (error) {
      setMessageError(error);
      return;
    }

    const cleanText = leoProfanity.clean(messageText.trim());

    try {
      await sendMessage(currentChannelId, cleanText, username);
      emitNewMessage({
        channelId: currentChannelId,
        message: {
          text: cleanText,
          username,
          // id и createdAt сервер добавит сам
        }
      });

      setMessageText('');
      setMessageError(null);
      inputRef.current?.focus();
    } catch (err) {
      setSubmitError(t('toast.error.sendMessage'));
      toast.error(t('toast.error.sendMessage'));
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
                        className="dropdown-toggle"
                        aria-label={t('dropdown.manageChannel')}
                        onClick={(e) => e.stopPropagation()} // предотвращаем переключение канала при открытии меню
                      >
                        ⋮
                      </button>
                      <div className="dropdown-menu">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowRenameModal(channel.id);
                          }}
                        >
                          {t('dropdown.rename')}
                        </button>
                        <button
                          type="button"
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

      <AddChannelModal isOpen={showAddModal} onClose={closeModalsAndRefresh} />
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