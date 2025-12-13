import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Container, Form, Button, Card, FloatingLabel, FormLabel } from 'react-bootstrap';
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

  const [messageText, setMessageText] = useState('');
  const [messageError, setMessageError] = useState(null);
  const [touched, setTouched] = useState(false);
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
      return t('validation.messageRequired') || 'Сообщение не может быть пустым';
    }
    if (text.trim().length > 500) {
      return t('validation.messageTooLong') || 'Сообщение слишком длинное';
    }
    if (leoProfanity.check(text)) {
      return t('validation.profanityDetected') || 'Нецензурная лексика запрещена';
    }
    return null;
  }, [t]);

  const handleMessageChange = (e) => {
    const text = e.target.value;
    setMessageText(text);
    if (touched) {
      setMessageError(validateMessage(text));
    }
  };

  const handleBlur = () => {
    setTouched(true);
    setMessageError(validateMessage(messageText));
  };

  const isMessageValid = () => {
    return currentChannelId && messageText.trim().length > 0 && !messageError;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setTouched(true);

    const error = validateMessage(messageText);
    if (error) {
      setMessageError(error);
      return;
    }

    let text = messageText.trim();
    if (leoProfanity.check(text)) {
      text = leoProfanity.clean(text);
      toast.warning(t('toast.warning.profanity') || 'Мат заменён');
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
    setMessageError(null);
    setTouched(false);
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

      {/* Форма ввода — теперь идентична LoginPage */}
      <div className="border-top pt-3 px-3">
        <Form onSubmit={handleSubmit}>
          {/* Видимый лейбл для тестов и доступности (даже без CSS) */}
          <FormLabel className="visually-hidden">
            {t('chat.inputPlaceholder') || 'Введите сообщение...'}
          </FormLabel>

          <FloatingLabel
            controlId="messageInput"
            label={t('chat.inputPlaceholder') || 'Введите сообщение...'}
            className="mb-3"
          >
            <Form.Control
              ref={inputRef}
              type="text"
              name="message"
              placeholder={t('chat.inputPlaceholder') || 'Введите сообщение...'}
              value={messageText}
              onChange={handleMessageChange}
              onBlur={handleBlur}
              isInvalid={touched && !!messageError}
              disabled={!currentChannelId}
              autoFocus
            />
            {touched && messageError && (
              <Form.Control.Feedback type="invalid">
                {messageError}
              </Form.Control.Feedback>
            )}
          </FloatingLabel>

          <div className="d-flex justify-content-end">
            <Button
              variant="primary"
              type="submit"
              disabled={!isMessageValid()}
              className="rounded-pill px-4"
            >
              {t('chat.sendButton') || 'Отправить'}
            </Button>
          </div>
        </Form>
      </div>
    </Container>
  );
};

export default ChatComponent;