import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, ListGroup, Form, Button, Card, Alert, Dropdown } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import leoProfanity from 'leo-profanity';
import { sendMessage, fetchMessagesByChannel, getChannels } from './api';  // Оставляем для fallback на API
import { connectSocket, disconnectSocket, joinChannel, leaveChannel, emitNewMessage } from './socket';
import { setChannels, setCurrentChannelId } from './features/channels/channelsSlice';
import { setMessages } from './features/messages/messagesSlice';
import { logout } from './features/auth/authSlice';
import api from './api';
import AddChannelModal from './components/AddChannelModal';
import RenameChannelModal from './components/RenameChannelModal';
import RemoveChannelModal from './components/RemoveChannelModal';

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

  // Защита на случай некорректного состояния (для отладки)
  if (process.env.NODE_ENV === 'development') {
    if (!Array.isArray(channels)) console.error('channels is not an array:', channels);
    if (!Array.isArray(messages)) console.error('messages is not an array:', messages);
  }

  // ИЗМЕНЕНО: Функция сохранения каналов в localStorage
  const saveChannelsToStorage = useCallback((channelsList) => {
    if (token) {  // Сохраняем только если JWT-токен валиден (симуляция auth)
      localStorage.setItem('channels', JSON.stringify(channelsList));
      console.log('Channels saved to localStorage:', channelsList);
    }
  }, [token]);

  // ИЗМЕНЕНО: Функция загрузки каналов из localStorage
  const loadChannelsFromStorage = useCallback(() => {
    const stored = localStorage.getItem('channels');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          console.log('Channels loaded from localStorage:', parsed);
          return parsed;
        }
      } catch (e) {
        console.error('Parse localStorage error:', e);
      }
    }
    return [];
  }, []);

  // ИЗМЕНЕНО: Refetch каналов (локально из storage + fallback API)
  const refetchChannels = useCallback(async () => {
    let channelsList = loadChannelsFromStorage();  // Сначала из localStorage

    if (channelsList.length === 0) {
      try {
        const response = await getChannels();  // Попытка API
        channelsList = Array.isArray(response.data?.channels) ? response.data.channels : [];
      } catch (error) {
        console.error('API fetch failed, using fallback:', error);
      }
    }

    // Fallback — если всё пусто, создаём дефолтные
    if (channelsList.length === 0) {
      channelsList = [
        {
          id: 1,
          name: 'general',
          removable: false,
          private: false,
        },
        {
          id: 2,
          name: 'random',
          removable: false,
          private: false,
        },
      ];
      console.log('Fallback: Created default channels');
      toast.info(t('app.fallbackChannels'));
    }

    dispatch(setChannels(channelsList));
    saveChannelsToStorage(channelsList);  // Сохраняем в storage

    const generalId = channelsList.find(c => c.name === 'general')?.id || channelsList[0]?.id || 1;
    dispatch(setCurrentChannelId(generalId));
    joinChannel(generalId);

    // Загрузка сообщений для текущего канала (локально или API)
    try {
      const response = await fetchMessagesByChannel(generalId);
      const messagesList = Array.isArray(response.data?.messages) ? response.data.messages : [];
      dispatch(setMessages(messagesList));
      // Сохраняем сообщения локально, если нужно (расширьте для messages)
      localStorage.setItem(`messages_${generalId}`, JSON.stringify(messagesList));
    } catch (error) {
      console.error('Fetch messages failed:', error);
      toast.error(t('toast.error.fetchMessages'));
      dispatch(setMessages([]));
    }
  }, [dispatch, t, loadChannelsFromStorage, saveChannelsToStorage]);

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    connectSocket(token);

    refetchChannels();  // Загрузка из storage + fallback

    const socket = connectSocket(token);
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
    if (!text || text.trim().length === 0) {
      return t('validation.messageRequired');
    }
    if (text.trim().length > 500) {
      return t('validation.messageTooLong');
    }
    if (leoProfanity.check(text)) {
      return t('validation.profanityDetected');
    }
    return null;
  }, [t]);

  const handleMessageChange = useCallback((e) => {
    const text = e.target.value;
    setMessageText(text);

    let cleanText = text;
    if (leoProfanity.check(text)) {
      cleanText = leoProfanity.clean(text);
      setMessageText(cleanText);
      toast.warning(t('toast.warning.profanity'));
    }

    const error = validateMessage(cleanText);
    setMessageError(error);
  }, [validateMessage, t]);

  const isMessageValid = useCallback(() => {
    return messageText.trim().length > 0 && !messageError && currentChannelId;
  }, [messageText, messageError, currentChannelId]);

  const handleChannelClick = async (channelId) => {
    if (currentChannelId === channelId) return;
    const prevId = currentChannelId;
    dispatch(setCurrentChannelId(channelId));
    if (prevId) {
      leaveChannel(prevId);
    }
    joinChannel(channelId);
    try {
      // Загрузка сообщений из localStorage или API
      const storedMessages = localStorage.getItem(`messages_${channelId}`);
      let messagesList = [];
      if (storedMessages) {
        messagesList = JSON.parse(storedMessages);
      } else {
        const response = await fetchMessagesByChannel(channelId);
        messagesList = Array.isArray(response.data?.messages) ? response.data.messages : [];
        localStorage.setItem(`messages_${channelId}`, JSON.stringify(messagesList));  // Сохраняем локально
      }
      dispatch(setMessages(messagesList));
    } catch (error) {
      console.error('Fetch messages error:', error);
      toast.error(t('toast.error.fetchMessages'));
      dispatch(setMessages([]));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);

    if (!isMessageValid()) return;

    let text = messageText.trim();
    if (!text || !currentChannelId) return;

    try {
      await sendMessage({ text, channelId: currentChannelId });
      await emitNewMessage({ text, channelId: currentChannelId, username });
      setMessageText('');
      setMessageError(null);
      inputRef.current?.focus();
    } catch (error) {
      console.error('Send message error:', error);
      setSubmitError(t('app.sendError'));
      toast.error(t('toast.error.network'));
      setTimeout(async () => {
        try {
          await emitNewMessage({ text, channelId: currentChannelId, username });
          setSubmitError(null);
        } catch (retryError) {
          setSubmitError(t('app.retryError'));
          toast.error(t('toast.error.generic'));
        }
      }, 1000);
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
    toast.info(t('toast.info.logout'));
  };

  // Обработчики модалок с refetch
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
    <Container fluid className="app vh-100 d-flex flex-column">
      <Row className="flex-grow-1">
        <Col md={3} className="border-end p-0 d-flex flex-column">
          <div className="p-3 border-bottom">
            <h5>{t('app.channelsTitle')}</h5>
            <Button variant="success" onClick={() => setShowAddModal(true)} className="w-100 mb-2">
              {t('app.addChannel')}
            </Button>
            <Button variant="outline-secondary" onClick={handleLogout} className="w-100">
              {t('app.logout')}
            </Button>
          </div>
          <ListGroup className="channels-list flex-grow-1 overflow-auto">
            {channels?.map((channel) => (
              <ListGroup.Item
                key={channel.id}
                active={currentChannelId === channel.id}
                onClick={() => handleChannelClick(channel.id)}
                className="d-flex justify-content-between align-items-center p-2"
              >
                <span>{t('app.channelPrefix')}{channel.name || 'Unnamed'}</span>
                {channel.removable && (
                  <Dropdown>
                    <Dropdown.Toggle variant="link" id={`dropdown-${channel.id}`} size="sm" className="p-0 border-0">
                      ...
                    </Dropdown.Toggle>
                    <Dropdown.Menu>
                      <Dropdown.Item onClick={() => setShowRenameModal(channel.id)}>
                        {t('dropdown.rename')}
                      </Dropdown.Item>
                      <Dropdown.Item onClick={() => setShowRemoveModal(channel.id)}>
                        {t('dropdown.remove')}
                      </Dropdown.Item>
                    </Dropdown.Menu>
                  </Dropdown>
                )}
              </ListGroup.Item>
            )) || <p className="text-center text-muted">{t('app.loadingChannels')}</p>}
          </ListGroup>
        </Col>
        <Col md={9} className="d-flex flex-column">
          <div className="flex-grow-1 p-3 overflow-auto bg-light" style={{ height: 'calc(100vh - 120px)' }}>
            {messages?.map((message) => (
              <Card key={message.id} className="mb-2">
                <Card.Body>
                  <Card.Subtitle className="mb-2 text-muted">{message.username}</Card.Subtitle>
                  <Card.Text className="chat-message">{message.text}</Card.Text>
                  <Card.Footer className="text-muted small">{new Date(message.createdAt).toLocaleString()}</Card.Footer>
                </Card.Body>
              </Card>
            )) || <p className="text-center text-muted">{t('app.noMessages')}</p>}
          </div>
          <Form onSubmit={handleSubmit} className="border-top p-3">
            {submitError && <Alert variant="danger" className="mb-2">{submitError}</Alert>}
            {messageError && <Alert variant="warning" className="mb-2">{messageError}</Alert>}
            <Row>
              <Col md={10}>
                <Form.Control
                  ref={inputRef}
                  name="message"
                  type="text"
                  value={messageText}
                  onChange={handleMessageChange}
                  placeholder={t('app.messagePlaceholder')}
                  disabled={!currentChannelId}
                />
              </Col>
              <Col md={2}>
                <Button 
                  variant="primary" 
                  type="submit" 
                  className="w-100" 
                  disabled={!isMessageValid()}
                >
                  {t('app.send')}
                </Button>
              </Col>
            </Row>
          </Form>
        </Col>
      </Row>
      <AddChannelModal isOpen={showAddModal} onClose={handleAddModalClose} />
      {showRenameModal && (
        <RenameChannelModal
          channel={channels?.find(c => c.id === showRenameModal)}
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
    </Container>
  );
};

export default App;