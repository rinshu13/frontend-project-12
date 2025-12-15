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

  const getDemoMessages = useCallback(channelName => [
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
      const key = `messages_${channelId}`;
      localStorage.setItem(key, JSON.stringify(messagesList));
    }
  }, [token]);

  const loadMessagesFromStorage = useCallback((channelId) => {
    const key = `messages_${channelId}`;
    const stored = localStorage.getItem(key);
    if (!stored) return [];
    try {
      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, []);

  const fetchChannels = useCallback(async () => {
    try {
      const response = await getChannels();
      const fetchedChannels = response.data.channels || [];
      dispatch(setChannels(fetchedChannels));
      saveChannelsToStorage(fetchedChannels);

      if (fetchedChannels.length > 0 && !currentChannelId) {
        dispatch(setCurrentChannelId(fetchedChannels[0].id));
      }
    } catch (error) {
      console.error('Error fetching channels:', error);
      const storedChannels = loadChannelsFromStorage();
      if (storedChannels.length > 0) {
        dispatch(setChannels(storedChannels));
        toast.info(t('app.usingLocalChannels'));
      } else {
        toast.error(t('app.channelsError'));
      }
    }
  }, [dispatch, currentChannelId, saveChannelsToStorage, loadChannelsFromStorage, t]);

  const fetchMessages = useCallback(async (channelId) => {
    try {
      const response = await fetchMessagesByChannel(channelId);
      const fetchedMessages = response.data.messages || [];
      dispatch(setMessages(fetchedMessages));
      saveMessagesToStorage(channelId, fetchedMessages);
    } catch (error) {
      console.error('Error fetching messages:', error);
      const storedMessages = loadMessagesFromStorage(channelId);
      if (storedMessages.length > 0) {
        dispatch(setMessages(storedMessages));
        toast.info(t('app.usingLocalMessages'));
      } else {
        const demoMessages = getDemoMessages(channels.find(c => c.id === channelId)?.name || 'general');
        dispatch(setMessages(demoMessages));
        saveMessagesToStorage(channelId, demoMessages);
        toast.info(t('app.usingDemoMessages'));
      }
    }
  }, [dispatch, channels, saveMessagesToStorage, loadMessagesFromStorage, getDemoMessages, t]);

  useEffect(() => {
    if (!hasInitialized.current && token) {
      hasInitialized.current = true;
      fetchChannels();
      connectSocket(token);

      const handleNewMessage = (message) => {
        dispatch(setMessages([...messages, message]));
        scrollToBottom();
      };

      // Assume socket events are set up here
    }

    return () => {
      disconnectSocket();
    };
  }, [token, fetchChannels, dispatch, messages]);

  useEffect(() => {
    if (currentChannelId) {
      fetchMessages(currentChannelId);
      joinChannel(currentChannelId);
    }
  }, [currentChannelId, fetchMessages]);

  const handleChannelClick = (id) => {
    dispatch(setCurrentChannelId(id));
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const closeModalsAndRefresh = (newChannelId = null) => {
    setShowAddModal(false);
    setShowRenameModal(null);
    setShowRemoveModal(null);
    fetchChannels();
    if (newChannelId) {
      dispatch(setCurrentChannelId(newChannelId));
    }
  };

  const isMessageValid = () => messageText.trim().length > 0;

  const handleMessageChange = (e) => {
    setMessageText(e.target.value);
    setMessageError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isMessageValid()) return;

    const censoredText = leoProfanity.clean(messageText.trim());
    if (censoredText !== messageText.trim()) {
      setMessageError(t('app.profanityWarning'));
    }

    try {
      const newMessage = {
        text: censoredText,
        channelId: currentChannelId,
        username,
      };
      await sendMessage(newMessage);
      emitNewMessage(newMessage);
      setMessageText('');
      setSubmitError(null);
      inputRef.current.focus();
    } catch (error) {
      console.error('Error sending message:', error);
      setSubmitError(t('app.messageError'));
    }
  };

  if (!token) {
    navigate('/login');
    return null;
  }

  return (
    <div className="container-fluid h-100 p-0">
      <div className="row h-100 m-0">
        <aside className="col-12 col-md-3 col-lg-2 bg-light border-end d-flex flex-column p-3">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h5 className="mb-0">{t('app.channels')}</h5>
            <button className="btn btn-sm btn-outline-secondary" onClick={() => setShowAddModal(true)}>
              +
            </button>
          </div>
          <div className="list-group flex-grow-1 overflow-auto">
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
              <div className="text-center text-muted">{t('app.loadingChannels')}</div>
            )}
          </div>
          <button className="btn btn-outline-danger w-100 mt-3" onClick={handleLogout}>
            {t('app.logout')}
          </button>
        </aside>
        <section className="col-12 col-md-9 col-lg-10 d-flex flex-column bg-white p-0">
          <div className="chat-header bg-light border-bottom p-3">
            <h6 className="mb-0">
              # {channels.find(c => c.id === currentChannelId)?.name || t('app.general')}
            </h6>
          </div>
          <div className="messages-area flex-grow-1 overflow-auto p-3">
            {messages.length > 0 ? (
              messages.map(msg => (
                <div key={msg.id} className="mb-3">
                  <div className="d-flex align-items-baseline">
                    <strong className="me-2">{msg.username}</strong>
                    <small className="text-muted">
                      {new Date(msg.createdAt).toLocaleString()}
                    </small>
                  </div>
                  <p className="mb-0">{msg.text}</p>
                </div>
              ))
            ) : (
              <div className="text-center text-muted mt-5">{t('app.noMessages')}</div>
            )}
            <div ref={messagesEndRef} />
          </div>
          <form onSubmit={handleSubmit} className="border-top p-3" noValidate>
            {submitError && <div className="alert alert-danger mb-3">{submitError}</div>}
            {messageError && <div className="alert alert-warning mb-3">{messageError}</div>}
            <div className="input-group">
              <input
                ref={inputRef}
                type="text"
                value={messageText}
                onChange={handleMessageChange}
                placeholder={t('app.messagePlaceholder')}
                disabled={!currentChannelId}
                className="form-control"
                autoFocus
              />
              <button type="submit" disabled={!isMessageValid()} className="btn btn-primary">
                {t('app.send')}
              </button>
            </div>
          </form>
        </section>
      </div>

      <AddChannelModal
        isOpen={showAddModal}
        onClose={closeModalsAndRefresh}
      />
      {showRenameModal && (
        <RenameChannelModal
          channel={channels.find(c => c.id === showRenameModal)}
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
