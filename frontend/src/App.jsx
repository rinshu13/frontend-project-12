import React, { useEffect, useRef, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, ListGroup, Form, Button, Card, Alert, Dropdown } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import leoProfanity from 'leo-profanity';  // Фильтрация мата
import { sendMessage, fetchMessagesByChannel } from './api';  // Исправлено: './api'
import { connectSocket, disconnectSocket, joinChannel, leaveChannel, emitNewMessage } from './socket';  // Исправлено: './socket'
import { setChannels, setCurrentChannelId } from '../features/channels/channelsSlice';
import { setMessages } from '../features/messages/messagesSlice';
import api from './api';  // Исправлено: './api'
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
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(null);
  const [showRemoveModal, setShowRemoveModal] = useState(null);

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    connectSocket(token);

    api.get('/channels').then((response) => {
      dispatch(setChannels(response.data.channels));
      const generalId = response.data.channels.find(c => c.name === 'general')?.id || 1;
      dispatch(setCurrentChannelId(generalId));
      joinChannel(generalId);
      fetchMessagesByChannel(generalId).then((response) => {
        dispatch(setMessages(response.data.messages));
      }).catch((error) => {
        toast.error(t('toast.error.fetchMessages'));
      });
    }).catch((error) => {
      toast.error(t('toast.error.fetchChannels'));
    });

    // Socket error handling
    const socket = connectSocket(token);
    const handleConnectError = () => {
      toast.error(t('toast.error.network'));
    };
    socket.on('connect_error', handleConnectError);
    return () => {
      socket.off('connect_error', handleConnectError);
      disconnectSocket();
    };
  }, [token, dispatch, navigate, t]);

  const handleChannelClick = async (channelId) => {
    if (currentChannelId === channelId) return;
    const prevId = currentChannelId;
    dispatch(setCurrentChannelId(channelId));
    if (prevId) {
      leaveChannel(prevId);
    }
    joinChannel(channelId);
    try {
      const response = await fetchMessagesByChannel(channelId);
      dispatch(setMessages(response.data.messages));
    } catch (error) {
      toast.error(t('toast.error.fetchMessages'));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);
    let text = e.target.message.value.trim();
    if (!text || !currentChannelId) return;

    // Фильтрация мата
    if (leoProfanity.check(text)) {
      text = leoProfanity.clean(text);
      toast.warning(t('toast.warning.profanity'));
    }

    try {
      await sendMessage({ text, channelId: currentChannelId });
      await emitNewMessage({ text, channelId: currentChannelId, username });
      e.target.message.value = '';
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
          </div>
          <ListGroup className="channels-list flex-grow-1 overflow-auto">
            {channels.map((channel) => (
              <ListGroup.Item
                key={channel.id}
                active={currentChannelId === channel.id}
                onClick={() => handleChannelClick(channel.id)}
                className="d-flex justify-content-between align-items-center p-2"
              >
                <span>{t('app.channelPrefix')}{channel.name}</span>
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
            ))}
          </ListGroup>
        </Col>
        <Col md={9} className="d-flex flex-column">
          <div className="flex-grow-1 p-3 overflow-auto bg-light" style={{ height: 'calc(100vh - 120px)' }}>
            {messages.map((message) => (
              <Card key={message.id} className="mb-2">
                <Card.Body>
                  <Card.Subtitle className="mb-2 text-muted">{message.username}</Card.Subtitle>
                  <Card.Text className="chat-message">{message.text}</Card.Text>
                  <Card.Footer className="text-muted small">{new Date(message.createdAt).toLocaleString()}</Card.Footer>
                </Card.Body>
              </Card>
            ))}
            {messages.length === 0 && <p className="text-center text-muted">{t('app.noMessages')}</p>}
          </div>
          <Form onSubmit={handleSubmit} className="border-top p-3">
            {submitError && <Alert variant="danger" className="mb-2">{submitError}</Alert>}
            <Row>
              <Col md={10}>
                <Form.Control
                  ref={inputRef}
                  name="message"
                  type="text"
                  placeholder={t('app.messagePlaceholder')}
                  disabled={!currentChannelId}
                />
              </Col>
              <Col md={2}>
                <Button variant="primary" type="submit" className="w-100" disabled={!currentChannelId}>
                  {t('app.send')}
                </Button>
              </Col>
            </Row>
          </Form>
        </Col>
      </Row>
      <AddChannelModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} />
      {showRenameModal && (
        <RenameChannelModal
          channel={channels.find(c => c.id === showRenameModal)}
          isOpen={true}
          onClose={() => setShowRenameModal(null)}
        />
      )}
      {showRemoveModal && (
        <RemoveChannelModal
          channelId={showRemoveModal}
          isOpen={true}
          onClose={() => setShowRemoveModal(null)}
        />
      )}
    </Container>
  );
};

export default App;