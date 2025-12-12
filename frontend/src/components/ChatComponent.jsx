import React, { useEffect,useState, useRef, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Container, Row, Col, Card, Alert, Form, Button } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import leoProfanity from 'leo-profanity';
import { setMessages } from '../features/messages/messagesSlice';

const ChatComponent = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const inputRef = useRef(null);
  const { token, username, currentChannelId } = useSelector((state) => ({
    token: state.auth.token,
    username: state.auth.username,
    currentChannelId: state.channels.currentChannelId,
    messages: state.messages.messages,
  }));
  const [messageError, setMessageError] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [messages, setLocalMessages] = useState([]);  

  useEffect(() => {
    if (currentChannelId && token) {
      const storedMessages = localStorage.getItem(`messages_${currentChannelId}`);
      let messagesList = [];
      if (storedMessages) {
        try {
          messagesList = JSON.parse(storedMessages);
        } catch (e) {
          console.error('Parse messages localStorage error:', e);
        }
      }

      // Если пусто, добавляем демо-сообщения
      if (messagesList.length === 0) {
        messagesList = [
          {
            id: 1,
            text: 'Добро пожаловать в канал!',
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
        localStorage.setItem(`messages_${currentChannelId}`, JSON.stringify(messagesList));
        toast.info(t('app.demoMessages') || 'Добавлены демо-сообщения');
      }

      setLocalMessages(messagesList);
      dispatch(setMessages(messagesList));  // Синхронизация с Redux
    }
  }, [currentChannelId, token, dispatch, t]);

  // Валидация сообщения
  const validateMessage = useCallback((text) => {
    if (!text || text.trim().length === 0) {
      return t('validation.messageRequired') || 'Сообщение обязательно';
    }
    if (text.trim().length > 500) {
      return t('validation.messageTooLong') || 'Сообщение слишком длинное';
    }
    if (leoProfanity.check(text)) {
      return t('validation.profanityDetected') || 'Обнаружен мат';
    }
    return null;
  }, [t]);

  // Изменение текста сообщения
  const handleMessageChange = useCallback((e) => {
    const text = e.target.value;
    setMessageText(text);
  }, []);

  // Проверка валидности
  const isMessageValid = useCallback(() => {
    return messageText.trim().length > 0 && !messageError && currentChannelId;
  }, [messageText, messageError, currentChannelId]);

  // Отправка сообщения
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessageError(null);

    let text = messageText.trim();
    const error = validateMessage(text);
    if (error) {
      setMessageError(error);
      return;
    }

    if (leoProfanity.check(text)) {
      text = leoProfanity.clean(text);
      toast.warning(t('toast.warning.profanity') || 'Нецензурное слово заменено');
    }

    const newMessage = {
      id: Date.now(),
      text: text,
      username: username,
      createdAt: new Date().toISOString(),
    };

    const updatedMessages = [...messages, newMessage];
    setLocalMessages(updatedMessages);
    dispatch(setMessages(updatedMessages));  // Обновление Redux
    localStorage.setItem(`messages_${currentChannelId}`, JSON.stringify(updatedMessages));  // Сохранение в localStorage
    setMessageText('');
    inputRef.current?.focus();
    toast.success(t('app.messageSent') || 'Сообщение отправлено');
  };

  return (
    <Container fluid className="chat-component vh-100 d-flex flex-column">
      <div className="flex-grow-1 p-3 overflow-auto bg-light">
        {messages.map((message) => (
          <Card key={message.id} className="mb-2">
            <Card.Body>
              <Card.Subtitle className="mb-2 text-muted">{message.username}</Card.Subtitle>
              <Card.Text className="chat-message">{message.text}</Card.Text>
              <Card.Footer className="text-muted small">{new Date(message.createdAt).toLocaleString()}</Card.Footer>
            </Card.Body>
          </Card>
        ))}
      </div>
      <Form onSubmit={handleSubmit} className="border-top p-3">
        {messageError && <Alert variant="warning" className="mb-2">{messageError}</Alert>}
        <Row>
          <Col md={10}>
            <Form.Control
              ref={inputRef}
              type="text"
              value={messageText}
              onChange={handleMessageChange}
              placeholder={t('app.messagePlaceholder') || 'Введите сообщение...'}
              disabled={!currentChannelId}
              autoFocus
            />
          </Col>
          <Col md={2}>
            <Button variant="primary" type="submit" className="w-100" disabled={!isMessageValid()}>
              {t('app.send') || 'Отправить'}
            </Button>
          </Col>
        </Row>
      </Form>
    </Container>
  );
};

export default ChatComponent;