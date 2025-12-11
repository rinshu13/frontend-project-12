import React, { useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, ListGroup, Form, Button, Card, Alert } from 'react-bootstrap';
import { sendMessage } from '../api';  // POST
import { connectSocket, disconnectSocket, joinChannel, emitNewMessage } from '../socket';  // Socket
import { setChannels, setCurrentChannelId } from '../features/channels/channelsSlice';
import { setMessages } from '../features/messages/messagesSlice';
import api from '../api';

const App = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const inputRef = useRef(null);  // Для фокуса input
  const { token, username } = useSelector((state) => state.auth);
  const { channels, currentChannelId } = useSelector((state) => state.channels);
  const { messages } = useSelector((state) => state.messages);
  const [submitError, setSubmitError] = React.useState(null);  // Ошибка отправки

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    // Connect socket
    connectSocket(token);

    // Fetch каналов
    api.get('/channels').then((response) => {
      dispatch(setChannels(response.data.channels));
      const generalId = response.data.channels.find(c => c.name === 'general')?.id || 1;  // General по умолчанию
      dispatch(setCurrentChannelId(generalId));
      joinChannel(generalId);  // Join room
    }).catch((error) => {
      console.error('Error fetching channels:', error);
    });

    // Fetch сообщений (все или по каналу — пока все)
    api.get('/messages').then((response) => {
      dispatch(setMessages(response.data.messages));
    }).catch((error) => {
      console.error('Error fetching messages:', error);
    });

    // Cleanup
    return () => disconnectSocket();
  }, [token, dispatch, navigate]);

  const handleChannelClick = (channelId) => {
    dispatch(setCurrentChannelId(channelId));
    joinChannel(channelId);  // Join new room
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);
    const text = e.target.message.value.trim();
    if (!text || !currentChannelId) return;

    try {
      // POST для persistent
      await sendMessage({ text, channelId: currentChannelId });
      // Emit для real-time + ack
      await emitNewMessage({ text, channelId: currentChannelId, username });
      e.target.message.value = '';  // Clear input
      inputRef.current?.focus();
    } catch (error) {
      console.error('Send message error:', error);
      setSubmitError('Ошибка отправки. Повторите попытку.');
      // Retry логика: Через 1 сек retry emit (если сеть упала)
      setTimeout(async () => {
        try {
          await emitNewMessage({ text, channelId: currentChannelId, username });
          setSubmitError(null);
        } catch (retryError) {
          setSubmitError('Повторная отправка не удалась.');
        }
      }, 1000);
    }
  };

  if (!token) return null;

  return (
    <Container fluid className="app vh-100 d-flex flex-column">
      <Row className="flex-grow-1">
        {/* Каналы */}
        <Col md={3} className="border-end p-0">
          <div className="p-3 border-bottom">
            <h5>Каналы</h5>
          </div>
          <ListGroup className="channels-list flex-grow-1">
            {channels.map((channel) => (
              <ListGroup.Item
                key={channel.id}
                active={currentChannelId === channel.id}
                onClick={() => handleChannelClick(channel.id)}
                className="d-flex justify-content-between align-items-center"
              >
                <span># {channel.name}</span>
                {channel.removable && <Button variant="danger" size="sm">Удалить</Button>}
              </ListGroup.Item>
            ))}
          </ListGroup>
        </Col>
        {/* Чат */}
        <Col md={9} className="d-flex flex-column">
          <div className="flex-grow-1 p-3 overflow-auto bg-light">
            {messages.map((message) => (
              <Card key={message.id} className="mb-2">
                <Card.Body>
                  <Card.Subtitle className="mb-2 text-muted">{message.username}</Card.Subtitle>
                  <Card.Text>{message.text}</Card.Text>
                  <Card.Footer className="text-muted small">{new Date(message.createdAt).toLocaleString()}</Card.Footer>
                </Card.Body>
              </Card>
            ))}
            {messages.length === 0 && <p className="text-center text-muted">Нет сообщений</p>}
          </div>
          {/* Форма */}
          <Form onSubmit={handleSubmit} className="border-top p-3">
            {submitError && <Alert variant="danger" className="mb-2">{submitError}</Alert>}
            <Row>
              <Col md={10}>
                <Form.Control
                  ref={inputRef}
                  name="message"
                  type="text"
                  placeholder="Введите сообщение..."
                  disabled={!currentChannelId}
                />
              </Col>
              <Col md={2}>
                <Button variant="primary" type="submit" className="w-100" disabled={!currentChannelId || !text}>
                  Отправить
                </Button>
              </Col>
            </Row>
          </Form>
        </Col>
      </Row>
    </Container>
  );
};

export default App;
