import { useEffect, useRef, useState, useCallback } from 'react';
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
import ChannelItem from './components/ChannelItem';
import 'bootstrap/dist/css/bootstrap.min.css'; // Bootstrap подключён

leoProfanity.add([
  'блядь', 'блять', 'пизда', 'пиздец', 'пиздеть', 'хуй', 'хуи', 'хуё', 'хуя', 'ебать', 'ебаный', 'еби', 'ебло',
  'нахуй', 'похуй', 'захуй', 'охуеть', 'охуенный', 'пидор', 'пидорас', 'сука', 'суки', 'блядина',
  'долбоёб', 'уёбище', 'mudak', 'pidor', 'pizda', 'huy', 'ebat', 'blyad',
]);

const App = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const inputRef = useRef(null);
  const messagesEndRef = useRef(null);

  const hasInitialized = useRef(false);

  const { token, username } = useSelector(state => state.auth);
  const { channels, currentChannelId } = useSelector(state => state.channels);
  const messages = useSelector(state => state.messages.messages) || [];

  const [messageText, setMessageText] = useState('');
  const [messageError, setMessageError] = useState(null);
  const [submitError, setSubmitError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(null);
  const [showRemoveModal, setShowRemoveModal] = useState(null);

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

  const saveCurrentChannelId = useCallback((channelId) => {
    localStorage.setItem('currentChannelId', channelId);
  }, []);

  const loadCurrentChannelId = useCallback(() => {
    const saved = localStorage.getItem('currentChannelId');
    return saved ? Number(saved) : null;
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
          const channel = channels.find(c => c.id === channelIdToLoad);
          msgs = getDemoMessages(channel?.name || 'general');
        }

        saveMessagesToStorage(channelIdToLoad, msgs);
      }

      dispatch(setMessages(msgs));
    },
    [channels, dispatch, getDemoMessages, loadMessagesFromStorage, saveMessagesToStorage],
  );

  const refetchChannels = useCallback(
    async (options = { switchToNewChannel: false, newChannelId: null }) => {
      const { switchToNewChannel = false, newChannelId = null } = options;

      let finalChannels = loadChannelsFromStorage();

      if (finalChannels.length === 0) {
        finalChannels = [
          { id: 1, name: 'general', removable: true },
          { id: 2, name: 'random', removable: true },
        ];
        saveChannelsToStorage(finalChannels);
      }

      try {
        const response = await getChannels();

        let serverChannels = [];

        if (Array.isArray(response.data?.data)) {
          serverChannels = response.data.data.map(item => ({
            id: item.id,
            name: item.attributes.name,
            removable: item.attributes.removable ?? true,
          }));
        } else if (Array.isArray(response.data)) {
          serverChannels = response.data.map(item => ({
            id: item.id,
            name: item.name || item.attributes?.name,
            removable: item.removable ?? item.attributes?.removable ?? true,
          }));
        } else if (Array.isArray(response.data?.channels)) {
          serverChannels = response.data.channels.map(item => ({
            id: item.id,
            name: item.name,
            removable: item.removable ?? true,
          }));
        }

        if (serverChannels.length > 0) {
          finalChannels = serverChannels;
        } else {
          const stored = loadChannelsFromStorage();
          if (stored.length > 0) {
            finalChannels = stored;
          }
        }
      } catch (err) {
        console.error('Failed to fetch channels from server:', err);
        toast.error(t('toast.error.fetchChannels'));

        const stored = loadChannelsFromStorage();
        if (stored.length > 0) {
          finalChannels = stored;
        }
      }

      dispatch(setChannels(finalChannels));
      saveChannelsToStorage(finalChannels);

      let targetChannelId = finalChannels[0]?.id || 1;

      const savedChannelId = loadCurrentChannelId();
      if (savedChannelId && finalChannels.some(c => c.id === savedChannelId)) {
        targetChannelId = savedChannelId;
      } else if (switchToNewChannel && newChannelId && finalChannels.some(c => c.id === newChannelId)) {
        targetChannelId = newChannelId;
        saveCurrentChannelId(newChannelId);
      } else if (currentChannelId && finalChannels.some(c => c.id === currentChannelId)) {
        targetChannelId = currentChannelId;
      }

      dispatch(setCurrentChannelId(targetChannelId));
      saveCurrentChannelId(targetChannelId);
      await loadChannelData(targetChannelId);
    },
    [
      dispatch,
      currentChannelId,
      loadChannelsFromStorage,
      saveChannelsToStorage,
      loadChannelData,
      t,
    ],
  );

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    if (hasInitialized.current) {
      return;
    }
    hasInitialized.current = true;

    const socket = connectSocket(token);

    socket.on('newMessage', (payload) => {
      if (payload.channelId === currentChannelId) {
        dispatch(setMessages([...messages, payload.message]));
      }
    });

    socket.on('renameChannel', (payload) => {
      dispatch(
        setChannels(
          channels.map(channel =>
            channel.id === payload.id
              ? { ...channel, name: payload.name }
              : channel,
          ),
        ),
      );
    });

    socket.on('removeChannel', (payload) => {
      dispatch(setChannels(channels.filter(channel => channel.id !== payload.id)));

      if (currentChannelId === payload.id) {
        const generalId = channels.find(c => c.name === 'general')?.id || channels[0]?.id || 1;
        dispatch(setCurrentChannelId(generalId));
        saveCurrentChannelId(generalId);
      }
    });

    refetchChannels();

    return () => {
      hasInitialized.current = false;
      socket.off('newMessage');
      socket.off('renameChannel');
      socket.off('removeChannel');
      disconnectSocket();
    };
  }, [token, navigate, dispatch, saveCurrentChannelId, loadCurrentChannelId]);

  useEffect(() => {
    if (!currentChannelId || !token) return;

    joinChannel(currentChannelId);
    loadChannelData(currentChannelId);
  }, [currentChannelId, token]);

  const handleChannelClick = (channelId) => {
    if (channelId === currentChannelId) return;
    dispatch(setCurrentChannelId(channelId));
    saveCurrentChannelId(channelId);
  };

  const validateMessage = useCallback((text) => {
    if (!text?.trim()) return t('validation.messageRequired');
    if (text.trim().length > 500) return t('validation.messageTooLong');
    if (leoProfanity.check(text)) return t('validation.profanityDetected');
    return null;
  }, [t]);

  const handleMessageChange = (e) => {
    const text = e.target.value;
    setMessageText(text);
    const error = validateMessage(text);
    setMessageError(error);

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

    const censoredText = leoProfanity.clean(rawText);

    if (censoredText !== rawText) {
      toast.warning(t('toast.warning.profanityCensored'));
    }

    try {
      await sendMessage(currentChannelId, censoredText, username);

      await emitNewMessage({
        channelId: currentChannelId,
        message: {
          text: censoredText,
          username,
          createdAt: new Date().toISOString(),
        },
      });

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

  const closeModalsAndRefresh = async (newChannelId = null) => {
    setShowAddModal(false);
    setShowRenameModal(null);
    setShowRemoveModal(null);
    await refetchChannels({
      switchToNewChannel: !!newChannelId,
      newChannelId: newChannelId ?? undefined,
    });
  };

  if (!token) return null;

  const currentChannel = channels.find(c => c.id === currentChannelId);

  return (
    <div className="h-100 d-flex flex-column bg-light">
      <div className="container h-100 my-4 overflow-hidden rounded shadow">
        <div className="row h-100 bg-white">

          {/* Sidebar каналов */}
          <div className="col-4 col-md-3 col-lg-2 channels-sidebar border-end bg-light">
            <div className="channels-header d-flex justify-content-between align-items-center p-3 border-bottom">
              <h5 className="mb-0">{t('app.channelsTitle')}</h5>
              <button
                className="btn btn-outline-success btn-sm"
                onClick={() => setShowAddModal(true)}
              >
                +
              </button>
            </div>
            <ul className="channels-list list-group list-group-flush overflow-auto h-100">
              {channels?.length > 0 ? (
                channels.map(channel => (
                  <ChannelItem
                    key={channel.id}
                    channel={channel}
                    currentChannelId={currentChannelId}
                    onChannelClick={handleChannelClick}
                    onRename={setShowRenameModal}
                    onRemove={setShowRemoveModal}
                  />
                ))
              ) : (
                <li className="list-group-item text-center text-muted">
                  {t('app.loadingChannels')}
                </li>
              )}
            </ul>
            <div className="p-3 border-top">
              <button className="btn btn-outline-secondary w-100" onClick={handleLogout}>
                {t('app.logout')}
              </button>
            </div>
          </div>

          {/* Основная область чата */}
          <div className="col d-flex flex-column h-100 position-relative">
            {/* Заголовок канала */}
            <div className="bg-light p-3 border-bottom shadow-sm">
              <h5 className="mb-1"># {currentChannel?.name || 'general'}</h5>
              <p className="text-muted mb-0 small">
                {messages.length} {t('app.messagesCount', { count: messages.length })}
              </p>
            </div>

            {/* Сообщения */}
            <div className="messages-area overflow-auto flex-grow-1 p-3">
              {messages.length > 0 ? (
                messages.map(msg => (
                  <div key={msg.id} className="message-card mb-3 p-3 bg-light rounded shadow-sm">
                    <div className="message-header d-flex justify-content-between align-items-center mb-1">
                      <strong>{msg.username}</strong>
                      <small className="text-muted">
                        {new Date(msg.createdAt).toLocaleString()}
                      </small>
                    </div>
                    <div className="message-body">{msg.text}</div>
                  </div>
                ))
              ) : (
                <div className="h-100 d-flex align-items-center justify-content-center text-muted">
                  {t('app.noMessages')}
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Форма ввода сообщения */}
            <div className="border-top bg-light p-3">
              <form onSubmit={handleSubmit} noValidate>
                {submitError && (
                  <div className="alert alert-danger mb-3">{submitError}</div>
                )}
                {messageError && (
                  <div className="alert alert-warning mb-3">{messageError}</div>
                )}
                <div className="input-group">
                  <input
                    ref={inputRef}
                    type="text"
                    value={messageText}
                    onChange={handleMessageChange}
                    placeholder={t('app.messagePlaceholder')}
                    disabled={!currentChannelId}
                    className="form-control form-input"
                    autoFocus
                  />
                  <button type="submit" disabled={!isMessageValid()} className="btn btn-primary">
                    {t('app.send')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      <AddChannelModal
        isOpen={showAddModal}
        onClose={newChannelId => closeModalsAndRefresh(newChannelId)}
      />
      {showRenameModal && (
        <RenameChannelModal
          channel={channels.find(c => c.id === showRenameModal)}
          isOpen={true}
          onClose={() => closeModalsAndRefresh()}
        />
      )}
      {showRemoveModal && (
        <RemoveChannelModal
          channelId={showRemoveModal}
          isOpen={true}
          onClose={() => closeModalsAndRefresh()}
        />
      )}
    </div>
  );
};

export default App;
