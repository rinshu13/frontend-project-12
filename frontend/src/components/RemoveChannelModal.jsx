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

      // Выполняем удаление локально
      performDelete();
    } catch (error) {
      console.error('Delete channel error:', error);

      // Демо-режим: если нет сервера — всё равно удаляем локально
      if (!error.response || error.request) {
        performDelete();
      } else {
        toast.error(t('toast.error.deleteChannel'));
      }
    } finally {
      setLoading(false);
    }
  };

  const performDelete = () => {
    const updatedChannels = channels.filter((c) => c.id !== channelId);
    dispatch(setChannels(updatedChannels));

    // Обновляем localStorage, чтобы refetchChannels в App.jsx увидел изменения
    localStorage.setItem('channels', JSON.stringify(updatedChannels));

    leaveChannel(channelId);

    const generalId = 1;
    dispatch(setCurrentChannelId(generalId));
    joinChannel(generalId);

    // Загружаем сообщения для general
    fetchMessagesByChannel(generalId)
      .then((response) => {
        dispatch(setMessages(response.data?.messages || []));
      })
      .catch(() => {
        // В демо-режиме App.jsx сам подгрузит из localStorage при смене канала
        dispatch(setMessages([]));
      });

    toast.success(t('toast.success.deleteChannel'));
    onClose();
  };

  // === ИСПРАВЛЕНИЕ: правильная обработка клика по overlay ===
  const handleOverlayClick = (e) => {
    // Закрываем только если клик именно по overlay, а не по внутреннему окну
    if (e.target === e.currentTarget) {
      onClose();
    }
  };
  // ==========================================================

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h5 className="modal-title">{t('modal.removeTitle')}</h5>
          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            disabled={loading}
            aria-label={t('modal.close')}
          >
            ×
          </button>
        </div>
        <div className="modal-body">
          <p>{t('modal.removeBody')}</p>
        </div>
        <div className="modal-footer">
          <button
            className="modal-btn modal-btn-secondary"
            onClick={onClose}
            disabled={loading}
          >
            {t('modal.removeCancel')}
          </button>
          <button
            className="modal-btn modal-btn-danger"
            onClick={handleDelete}
            disabled={loading}
          >
            {loading ? t('modal.removeLoading') : t('modal.removeSubmit')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RemoveChannelModal;
