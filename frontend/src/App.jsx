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

  const saveMessagesToStorage = useCallback((channelId, msgs) => {
    if (token) localStorage.setItem(`messages_${channelId}`, JSON.stringify(msgs));
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

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const handleChannelClick = (id) => {
    dispatch(setCurrentChannelId(id));
  };

  const closeModalsAndRefresh = (newChannelId) => {
    setShowAddModal(false);
    setShowRenameModal(null);
    setShowRemoveModal(null);
    if (newChannelId) {
      dispatch(setCurrentChannelId(newChannelId));
    }
    // Refresh channels if needed
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
      setMessageError(t('app.messageCensored'));
    }

    try {
      await sendMessage(currentChannelId, censoredText, username);
      setMessageText('');
      inputRef.current?.focus();
    } catch (error) {
      setSubmitError(t('app.submitError'));
    }
  };

  if (!token) {
    navigate('/login');
    return null;
  }

  return (
    <div className="container-fluid h-100 bg-light">
      <div className="row h-100">
        <aside className="col-3 col-md-2 bg-white border-end shadow-sm d-flex flex-column p-3">
          <div className="d-flex flex-column gap-2 mb-3">
            <button className="btn btn-success w-100 mb-2" onClick={() => setShowAddModal(true)}>
              {t('app.addChannel')}
            </button>
            <button className="btn btn-outline-danger w-100" onClick={handleLogout}>
              {t('app.logout')}
            </button>
          </div>
          <div className="list-group overflow-auto flex-grow-1" role="list">
            {channels?.length > 0
              ? channels.map(channel => (
                  <ChannelItem
                    key={channel.id}
                    channel={channel}
                    currentChannelId={currentChannelId}
                    onChannelClick={handleChannelClick}
                    onRename={setShowRenameModal}
                    onRemove={setShowRemoveModal}
                  />
                ))
              : <p className="text-center text-muted mt-3">{t('app.loadingChannels')}</p>}
          </div>
        </aside>
        <section className="col-9 col-md-10 d-flex flex-column bg-white p-4">
          <div className="flex-grow-1 overflow-auto mb-3">
            {messages.length > 0
              ? messages.map(msg => (
                  <div key={msg.id} className="card mb-3 shadow-sm">
                    <div className="card-header bg-light d-flex justify-content-between">
                      <strong>{msg.username}</strong>
                      <small className="text-muted">{new Date(msg.createdAt).toLocaleString()}</small>
                    </div>
                    <div className="card-body">
                      <p className="mb-0">{msg.text}</p>
                    </div>
                  </div>
                ))
              : <p className="text-center text-muted mt-5">{t('app.noMessages')}</p>}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSubmit} className="mt-auto" noValidate>
            {submitError && <div className="alert alert-danger mb-3">{submitError}</div>}
            {messageError && <div className="alert alert-warning mb-3">{messageError}</div>}

            <div className="input-group">
              <input
                ref={inputRef}
                type="text"
                value={messageText}
                aria-label="Новое сообщение"
                onChange={handleMessageChange}
                placeholder={t('app.messagePlaceholder')}
                disabled={!currentChannelId}
                className="form-control"
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

export default App
