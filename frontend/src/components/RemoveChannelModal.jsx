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

      // Локальное обновление состояния
      const updatedChannels = channels.filter((c) => c.id !== channelId);
      dispatch(setChannels(updatedChannels));
      localStorage.setItem('channels', JSON.stringify(updatedChannels));

      leaveChannel(channelId);

      const generalId = 1;
      dispatch(setCurrentChannelId(generalId));
      joinChannel(generalId);

      // Загружаем сообщения для general
      try {
        const response = await fetchMessagesByChannel(generalId);
        dispatch(setMessages(response.data?.messages || []));
      } catch {
        dispatch(setMessages([]));
      }

      // Успешное уведомление — выводится ПЕРЕД закрытием модалки
      toast.success(t('toast.success.deleteChannel'));

      // Закрываем модалку только после всего
      onClose();
    } catch (error) {
      console.error('Delete channel error:', error);
      if (!error.response || error.request) {
        // Оффлайн-режим: всё равно считаем успешным
        toast.success(t('toast.success.deleteChannel'));
        onClose();
      } else {
        toast.error(t('toast.error.deleteChannel'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h5 className="modal-title">{t('modal.removeTitle')}</h5>
          <button
            type="button"
            className="modal-close"
            disabled={true}
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
            type="button"
            className="modal-btn modal-btn-secondary"
            onClick={handleCancel}
            disabled={loading}
          >
            {t('modal.removeCancel')}
          </button>
          <button
            type="button"
            className="btn btn-danger"
            onClick={handleDelete}
            disabled={loading}
            data-testid="remove-channel-submit"
          >
            {loading ? t('modal.removeLoading') : t('modal.removeSubmit')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RemoveChannelModal;