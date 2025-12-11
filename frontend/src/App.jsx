import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, ListGroup, Form, Button, Card } from 'react-bootstrap';
import api from '../api';  // Импорт API
import { setChannels, setCurrentChannelId } from '../features/channels/channelsSlice';
import { setMessages } from '../features/messages/messagesSlice';

const App = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { token } = useSelector((state) => state.auth);
  const { channels, currentChannelId } = useSelector((state) => state.channels);
  const { messages } = useSelector((state) => state.messages);

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    // Fetch каналов
    api.get('/channels').then((response) => {
      dispatch(setChannels(response.data.channels));
      if (response.data.channels.length > 0) {
        dispatch(setCurrentChannelId(response.data.channels[0].id));  // Первый канал по умолчанию
      }
    }).catch((error) => {
      console.error('Error fetching channels:', error);
    });

    // Fetch сообщений (все, или по каналу — пока все)
    api.get('/messages').then((response) => {
      dispatch(setMessages(response.data.messages));
    }).catch((error) => {
      console.error('Error fetching messages:', error);
    });
  }, [token, dispatch, navigate]);

  if (!token) return null;

  const handleChannelClick = (channelId) => {
    dispatch(setCurrentChannelId(channelId));
    // Fetch сообщений для канала позже: api.get(`/messages?channelId=${channelId}`)
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Заглушка для отправки — в следующих шагах
    console.log('Send message');
  };

  return (
    <Container fluid className="app vh-100">
      <Row className="h-100">
        {/* Левая панель: Каналы */}
        <Col md={3} className="border-end p-0">
          <h5 className="p-3 border-bottom">Каналы</h5>
          <ListGroup className="channels-list">
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
        {/* Правая панель: Чат */}
        <Col md={9} className="d-flex flex-column h-100">
          <div className="flex-grow-1 p-3 overflow-auto">
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
          {/* Форма ввода */}
          <Form onSubmit={handleSubmit} className="border-top p-3">
            <Row>
              <Col md={10}>
                <Form.Control
                  type="text"
                  placeholder="Введите сообщение..."
                  disabled={!currentChannelId}
                />
              </Col>
              <Col md={2}>
                <Button variant="primary" type="submit" className="w-100" disabled={!currentChannelId}>
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
