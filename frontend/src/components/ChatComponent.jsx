import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Container, Form, Button, Card, Alert, InputGroup } from 'react-bootstrap';
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
  }));

  const [messageError, setMessageError] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [messages, setLocalMessages] = useState([]);

  // Загрузка сообщений при смене канала
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

      // Демо-сообщения, если пусто
      if (messagesList.length === 0) {
        messagesList = [
          {
            id: 1,
            text: t('chat.welcomeMessage') || 'Добро пожаловать в канал!',
            username: 'System',
            createdAt: new Date(Date.now() - 3600000).toISOString(),
          },
          {
            id: 2,
            text: t('chat.demoMessage') || 'Это демо-сообщение. Отправьте своё!',
            username: 'DemoUser',
            createdAt: new Date().toISOString(),
          },
        ];
        localStorage.setItem(`messages_${currentChannelId}`, JSON.stringify(messagesList));
        toast.info(t('app.demoMessages') || 'Добавлены демо-сообщения');
      }

      setLocalMessages(messagesList);
      dispatch(setMessages(messagesList));
    }
  }, [currentChannelId, token, dispatch, t]);

  // Валидация
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
    setMessageError(null);  // Сбрасываем ошибку при вводе
  }, []);

  const isMessageValid = useCallback(() => {
    return currentChannelId && messageText.trim().length > 0 && !messageError;
  }, [currentChannelId, messageText, messageError]);

  // Отправка сообщения
  const handleSubmit = (e) => {
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
      toast.warning(t('toast.warning.profanity'));
    }

    const newMessage = {
      id: Date.now(),
      text,
      username,
      createdAt: new Date().toISOString(),
    };

    const updatedMessages = [...messages, newMessage];
    setLocalMessages(updatedMessages);
    dispatch(setMessages(updatedMessages));
    localStorage.setItem(`messages_${currentChannelId}`, JSON.stringify(updatedMessages));

    setMessageText('');
    inputRef.current?.focus();
  };

  return (
    <Container fluid className="h-100 d-flex flex-column">
      {/* Список сообщений */}
      <div className="flex-grow-1 overflow-auto p-3 bg-light">
        {messages.length === 0 ? (
          <p className="text-center text-muted">{t('app.noMessages')}</p>
        ) : (
          messages.map((message) => (
            <Card key={message.id} className="mb-3 border-0 shadow-sm">
              <Card.Body className="p-3">
                <Card.Subtitle className="mb-2 text-muted small">
                  {message.username}
                </Card.Subtitle>
                <Card.Text className="mb-1">{message.text}</Card.Text>
                <Card.Footer className="border-0 bg-transparent p-0 text-muted small">
                  {new Date(message.createdAt).toLocaleString()}
                </Card.Footer>
              </Card.Body>
            </Card>
          ))
        )}
      </div>

      {/* Форма ввода */}
      <div className="border-top pt-3 px-3">
        {messageError && <Alert variant="warning" className="mb-3 py-2">{messageError}</Alert>}
        <Form onSubmit={handleSubmit}>
          <InputGroup>
            <Form.Control
              ref={inputRef}
              type="text"
              value={messageText}
              onChange={handleMessageChange}
              placeholder={t('chat.inputPlaceholder')}
              aria-label={t('chat.inputAriaLabel')}
              className="border-0 shadow-none ps-2"
              disabled={!currentChannelId}
              autoFocus
            />
            <Button
              variant="link"
              type="submit"
              disabled={!isMessageValid()}
              className="text-muted p-0"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                width="24"
                height="24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
              <span className="visually-hidden">{t('chat.sendButton')}</span>
            </Button>
          </InputGroup>
        </Form>
      </div>
    </Container>
  );
};

export default ChatComponent;
