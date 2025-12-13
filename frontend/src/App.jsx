import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import leoProfanity from 'leo-profanity';
import { sendMessage, fetchMessagesByChannel, getChannels } from './api';
import { connectSocket, disconnectSocket, joinChannel, leaveChannel, emitNewMessage } from './socket';
import { setChannels, setCurrentChannelId } from './features/channels/channelsSlice';
import { setMessages } from './features/messages/messagesSlice';
import { logout, initAuth } from './features/auth/authSlice';
import AddChannelModal from './components/AddChannelModal';
import RenameChannelModal from './components/RenameChannelModal';
import RemoveChannelModal from './components/RemoveChannelModal';
import './App.css'; // ← наш новый CSS

const App = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const inputRef = useRef(null);
  const { token, username } = useSelector((state) => state.auth);
  const { channels, currentChannelId } = useSelector((state) => state.channels);
  const { messages } = useSelector((state) => state.messages);
  const [submitError, setSubmitError] = useState(null);
  const [messageError, setMessageError] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(null);
  const [showRemoveModal, setShowRemoveModal] = useState(null);

  useEffect(() => {
    dispatch(initAuth());
  }, [dispatch]);

  const saveChannelsToStorage = useCallback((channelsList) => {
    if (token) {
      localStorage.setItem('channels', JSON.stringify(channelsList));
    }
  }, [token]);

  const loadChannelsFromStorage = useCallback(() => {
    const stored = localStorage.getItem('channels');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        return Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        console.error('Parse localStorage error:', e);
      }
    }
    return [];
  }, []);

  const getDemoMessages = useCallback((channelName) => {
    return [
      {
        id: 1,
        text: `Добро пожаловать в канал ${channelName}!`,
        username: 'System',
        createdAt: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        id: 2,
        text: 'Это демо-сообщение. Отправьте своё!',
        username: 'DemoUser',
        createdAt: new Date().toISOString(),
      },
    ];
  }, []);

  const saveMessagesToStorage = useCallback((channelId, messagesList) => {
    if (token) {
      localStorage.setItem(`messages_${channelId}`, JSON.stringify(messagesList));
    }
  }, [token]);

  const loadMessagesFromStorage = useCallback((channelId) => {
    const stored = localStorage.getItem(`messages_${channelId}`);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        return Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        console.error('Parse messages localStorage error:', e);
      }
    }
    return [];
  }, []);

  const refetchChannels = useCallback(async () => {
    // ... (логика осталась прежней, только без изменений в UI)
    // Опущена для краткости — код идентичен вашему оригиналу
  }, [dispatch, t, loadChannelsFromStorage, saveChannelsToStorage, loadMessagesFromStorage, saveMessagesToStorage, getDemoMessages]);

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    const socket = connectSocket(token);

    const fallbackChannels = [
      { id: 1, name: 'general', removable: false, private: false },
      { id: 2, name: 'random', removable: false, private: false },
    ];
    dispatch(setChannels(fallbackChannels));
    dispatch(setCurrentChannelId(1));
    joinChannel(1);

    refetchChannels();

    const handleConnectError = () => {
      toast.error(t('toast.error.network'));
    };
    socket.on('connect_error', handleConnectError);

    return () => {
      socket.off('connect_error', handleConnectError);
      disconnectSocket();
    };
  }, [token, dispatch, navigate, t, refetchChannels]);

  const validateMessage = useCallback((text) => {
    if (!text || text.trim().length === 0) return t('validation.messageRequired');
    if (text.trim().length > 500) return t('validation.messageTooLong');
    if (leoProfanity.check(text)) return t('validation.profanityDetected');
    return null;
  }, [t]);

  const handleMessageChange = useCallback((e) => {
    const text = e.target.value;
    setMessageText(text);

    if (leoProfanity.check(text)) {
      const cleanText = leoProfanity.clean(text);
      setMessageText(cleanText);
      toast.warning(t('toast.warning.profanity'));
    }

    const error = validateMessage(text);
    setMessageError(error);
  }, [validateMessage, t]);

  const isMessageValid = useCallback(() => {
    return messageText.trim().length > 0 && !messageError && currentChannelId;
  }, [messageText, messageError, currentChannelId]);

  const handleChannelClick = async (channelId) => {
    // ... (логика осталась прежней)
  };

  const handleSubmit = async (e) => {
    // ... (логика осталась прежней)
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
    toast.info(t('toast.info.logout'));
  };

  const handleAddModalClose = async () => {
    setShowAddModal(false);
    await refetchChannels();
  };

  const handleRenameModalClose = async () => {
    setShowRenameModal(null);
    await refetchChannels();
  };

  const handleRemoveModalClose = async () => {
    setShowRemoveModal(null);
    await refetchChannels();
  };

  if (!token) return null;

  return (
    <div className="app vh-100 d-flex flex-column">
      <div className="app-body d-flex flex-grow-1">
        {/* Левая колонка — каналы */}
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

          <ul className="channels-list">
            {channels?.length > 0 ? (
              channels.map((channel) => (
                <li
                  key={channel.id}
                  className={`channel-item ${currentChannelId === channel.id ? 'active' : ''}`}
                  onClick={() => handleChannelClick(channel.id)}
                >
                  <span className="channel-name">#{channel.name || 'Unnamed'}</span>
                  {channel.removable && (
                    <div className="channel-dropdown">
                      <button className="dropdown-toggle">⋮</button>
                      <div className="dropdown-menu">
                        <button onClick={() => setShowRenameModal(channel.id)}>
                          {t('dropdown.rename')}
                        </button>
                        <button onClick={() => setShowRemoveModal(channel.id)}>
                          {t('dropdown.remove')}
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              ))
            ) : (
              <p className="text-center text-muted">{t('app.loadingChannels')}</p>
            )}
          </ul>
        </aside>

        {/* Правая колонка — чат */}
        <section className="chat-section d-flex flex-column">
          <div className="messages-area">
            {messages?.length > 0 ? (
              messages.map((message) => (
                <div key={message.id} className="message-card">
                  <div className="message-header">
                    <strong>{message.username}</strong>
                  </div>
                  <div className="message-body">{message.text}</div>
                  <div className="message-footer">
                    {new Date(message.createdAt).toLocaleString()}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-muted">{t('app.noMessages')}</p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="message-form">
            {submitError && <div className="alert alert-danger">{submitError}</div>}
            {messageError && <div className="alert alert-warning">{messageError}</div>}

            <div className="input-group">
              <input
                ref={inputRef}
                type="text"
                value={messageText}
                onChange={handleMessageChange}
                placeholder={t('app.messagePlaceholder')}
                disabled={!currentChannelId}
                className="form-input"
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

      <AddChannelModal isOpen={showAddModal} onClose={handleAddModalClose} />
      {showRenameModal && (
        <RenameChannelModal
          channel={channels?.find((c) => c.id === showRenameModal)}
          isOpen={true}
          onClose={handleRenameModalClose}
        />
      )}
      {showRemoveModal && (
        <RemoveChannelModal
          channelId={showRemoveModal}
          isOpen={true}
          onClose={handleRemoveModalClose}
        />
      )}
    </div>
  );
};

export default App;