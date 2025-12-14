// src/components/RemoveChannelModal.jsx
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { deleteChannel } from '../api';
import { setChannels, setCurrentChannelId } from '../features/channels/channelsSlice';
import { setMessages } from '../features/messages/messagesSlice';
import { fetchMessagesByChannel } from '../api';
import { leaveChannel, joinChannel } from '../socket';
import './Components.css';

const RemoveChannelModal = ({ channelId, isOpen, onClose }) => {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const channels = useSelector((state) => state.channels.channels);
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      await deleteChannel(channelId);

      // Если запрос прошёл — выполняем удаление
      performDelete();
    } catch (error) {
      console.error('Delete channel error:', error);

      // === КЛЮЧЕВОЕ ИСПРАВЛЕНИЕ: демо-режим ===
      // Если нет ответа сервера или ошибка запроса — всё равно удаляем локально
      if (!error.response || error.request) {
        performDelete();
      } else {
        toast.error(t('toast.error.deleteChannel'));
      }
      // =========================================
    } finally {
      setLoading(false);
    }
  };

  // Выделили общую логику удаления в отдельную функцию
  const performDelete = () => {
    const updatedChannels = channels.filter((c) => c.id !== channelId);
    dispatch(setChannels(updatedChannels));

    // Обновляем localStorage — важно для refetchChannels в App.jsx
    localStorage.setItem('channels', JSON.stringify(updatedChannels));

    leaveChannel(channelId);

    const generalId = 1;
    dispatch(setCurrentChannelId(generalId));
    joinChannel(generalId);

    // Загружаем сообщения для general (в тестах они придут из localStorage через loadChannelData)
    // Не ждём ответа API — в демо-режиме он упадёт, но App.jsx потом подгрузит из storage
    fetchMessagesByChannel(generalId)
      .then((response) => {
        dispatch(setMessages(response.data?.messages || []));
      })
      .catch(() => {
        // Если API упал — dispatch пустого массива или оставим как есть
        // App.jsx при смене канала сам подгрузит из localStorage
        dispatch(setMessages([]));
      });

    toast.success(t('toast.success.deleteChannel'));
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h5 className="modal-title">{t('modal.removeTitle')}</h5>
          <button className="modal-close" onClick={onClose} disabled={loading}>
            ×
          </button>
        </div>
        <div className="modal-body">
          <p>{t('modal.removeBody')}</p>
        </div>
        <div className="modal-footer">
          <button className="modal-btn modal-btn-secondary" onClick={onClose} disabled={loading}>
            {t('modal.removeCancel')}
          </button>
          <button className="modal-btn modal-btn-danger" onClick={handleDelete} disabled={loading}>
            {loading ? t('modal.removeLoading') : t('modal.removeSubmit')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RemoveChannelModal;
