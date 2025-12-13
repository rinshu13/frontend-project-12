import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Container, Form, Button, Card, FloatingLabel } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import leoProfanity from 'leo-profanity';
import { setMessages } from '../features/messages/messagesSlice';
import { FormFloating } from 'react-bootstrap';

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
  const [loading, setLoading] = useState(false); // Добавлено для единообразия с LoginPage
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched(true);

    const error = validateMessage(messageText);
    if (error) {
      setMessageError(error);
      return;
    }

    setLoading(true);

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
    setLoading(false);

    inputRef.current?.focus();
  };

  return (
    <Container fluid className="h-100 d-flex flex-column">
      {/* Список сообщений */}
      <div className="mt-auto px-5 py-3">
        <form onSubmit={handleSubmit} noValidate className="py-3 border rounded-2">
          <div className="input-group">
            <input
              ref={inputRef}
              type="text"
              name="body"
              aria-label="Новое сообщение"
              placeholder={t('chat.inputPlaceholder') || 'Введите сообщение...'}
              className="border-0 p-0 ps-2 form-control"
              value={messageText}
              onChange={handleMessageChange}
              onBlur={handleBlur}
              disabled={!currentChannelId || loading}
              autoFocus
              required
            />
            <button
              type="submit"
              className="btn btn-group-vertical input-group-text border-0 bg-transparent"
              disabled={!messageText.trim() || loading || !!messageError}
              aria-label={t('chat.sendButton') || 'Отправить'}
            >
              <span className="visually-hidden">{t('chat.sendButton') || 'Отправить'}</span>
              → {/* или можно использовать SVG-стрелку */}
            </button>
          </div>

          {touched && messageError && (
            <div className="invalid-feedback d-block mt-2">
              {messageError}
            </div>
          )}
        </form>
      </div>

      {/* Форма ввода — теперь полностью как в LoginPage */}
      <div className="border-top px-3 pb-3">
        <Form onSubmit={handleSubmit} noValidate>
          {/* Простое поле ввода без FloatingLabel и без видимой <label> */}
          <Form.Control
            ref={inputRef}
            type="text"
            name="body"                          // именно "body", как на первой картинке
            aria-label="Новое сообщение"         // это будет единственным доступным именем
            placeholder={t('chat.inputPlaceholder') || 'Введите сообщение...'}
            className="mb-3 border-0 p-3"        // стили по вкусу, чтобы выглядело похоже
            value={messageText}
            onChange={handleMessageChange}
            onBlur={handleBlur}
            disabled={!currentChannelId || loading}
            isInvalid={touched && !!messageError}
            autoFocus
            required
          />

          {/* Сообщение об ошибке валидации */}
          {touched && messageError && (
            <div className="invalid-feedback d-block">
              {messageError}
            </div>
          )}

          <Button
            variant="primary"
            type="submit"
            className="w-100 rounded-pill py-2"
            disabled={loading || !currentChannelId || !messageText.trim() || !!messageError}
          >
            {loading ? 'Отправка...' : t('chat.sendButton') || 'Отправить'}
          </Button>
        </Form>
      </div>
    </Container>
  );
};

export default ChatComponent;
