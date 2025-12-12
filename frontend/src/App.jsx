import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, ListGroup, Form, Button, Card, Alert, Dropdown } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import leoProfanity from 'leo-profanity';
import { sendMessage, fetchMessagesByChannel, getChannels, createChannel } from './api';  // ИЗМЕНЕНО: добавлен createChannel для примера
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

  // ИЗМЕНЕНО: Функция refetch каналов (используется после модалок)
  const refetchChannels = useCallback(async () => {
    try {
      const response = await getChannels();
      let channelsList = Array.isArray(response.data?.channels) ? response.data.channels : [];
      console.log('Refetched channels:', channelsList);

      // Fallback, если после создания список пустой или не обновился
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
        console.log('Fallback after refetch: Created default channels');
        toast.info(t('app.fallbackChannels'));
      }

      dispatch(setChannels(channelsList));
      // Переустанавливаем currentChannelId, если изменилось
      const generalId = channelsList.find(c => c.name === 'general')?.id || channelsList[0]?.id || 1;
      dispatch(setCurrentChannelId(generalId));
      joinChannel(generalId);
    } catch (error) {
      console.error('Refetch channels failed:', error);
      toast.error(t('toast.error.fetchChannels'));
      // Fallback в catch
      const fallbackChannels = [
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
      dispatch(setChannels(fallbackChannels));
      const generalId = 1;
      dispatch(setCurrentChannelId(generalId));
      joinChannel(generalId);
    }
  }, [dispatch, t]);

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    connectSocket(token);

    refetchChannels();  // ИЗМЕНЕНО: Используем refetch вместо прямого getChannels

    const socket = connectSocket(token);
    const handleConnectError = () => {
      toast.error(t('toast.error.network'));
    };
    socket.on('connect_error', handleConnectError);

    return () => {
      socket.off('connect_error', handleConnectError);
      disconnectSocket();
    };
  }, [token, dispatch, navigate, t, refetchChannels]);  // ИЗМЕНЕНО: Добавлен refetchChannels в deps

  // ... остальной код (validateMessage, handleMessageChange, isMessageValid, handleChannelClick, handleSubmit, handleLogout — без изменений)

  // ИЗМЕНЕНО: Обработчики модалок с refetch после закрытия
  const handleAddModalClose = async () => {
    setShowAddModal(false);
    await refetchChannels();  // Refetch после создания
  };

  const handleRenameModalClose = async () => {
    setShowRenameModal(null);
    await refetchChannels();  // Refetch после переименования
  };

  const handleRemoveModalClose = async () => {
    setShowRemoveModal(null);
    await refetchChannels();  // Refetch после удаления
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
                <span>{t('app.channelPrefix')}{channel.name || 'Unnamed'} </span>  // ИЗМЕНЕНО: Fallback 'Unnamed' если name undefined
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
        {/* ... остальной JSX без изменений */}
      </Row>
      <AddChannelModal isOpen={showAddModal} onClose={handleAddModalClose} />  // ИЗМЕНЕНО: onClose с refetch
      {showRenameModal && (
        <RenameChannelModal
          channel={channels?.find(c => c.id === showRenameModal)}
          isOpen={true}
          onClose={handleRenameModalClose}  // ИЗМЕНЕНО: onClose с refetch
        />
      )}
      {showRemoveModal && (
        <RemoveChannelModal
          channelId={showRemoveModal}
          isOpen={true}
          onClose={handleRemoveModalClose}  // ИЗМЕНЕНО: onClose с refetch
        />
      )}
    </Container>
  );
};

export default App;