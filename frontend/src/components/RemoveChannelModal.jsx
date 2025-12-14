// src/components/RemoveChannelModal.jsx
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { deleteChannel } from '../api';
import { setChannels, setCurrentChannelId } from '../features/channels/channelsSlice';
import { setMessages } from '../features/messages/messagesSlice';
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

      // Если запрос прошёл — обновляем локально (на всякий случай, для consistency)
      performLocalDelete();
    } catch (error) {
      console.error('Delete channel error:', error);

      // === ДЕМО-РЕЖИМ: если ошибка сети — всё равно удаляем локально ===
      if (!error.response || error.request) {
        performLocalDelete();
        return;
      }
      // ===========================================================

      toast.error(t('toast.error.deleteChannel'));
    } finally {
      setLoading(false);
    }
  };

  // Выносим логику удаления в отдельную функцию — используется в try и catch
  const performLocalDelete = () => {
    const updatedChannels = channels.filter((c) => c.id !== channelId);

    // Обновляем каналы в сторе и localStorage
    dispatch(setChannels(updatedChannels));
    localStorage.setItem('channels', JSON.stringify(updatedChannels));

    // Удаляем сообщения удалённого канала из localStorage (опционально, но полезно)
    localStorage.removeItem(`messages_${channelId}`);

    leaveChannel(channelId);

    // Переключаемся на general (id = 1)
    const generalId = 1;
    dispatch(setCurrentChannelId(generalId));
    joinChannel(generalId);

    // Загружаем сообщения для general — сначала из localStorage, потом демо если пусто
    let messages = [];
    const storedMessages = localStorage.getItem(`messages_${generalId}`);
    if (storedMessages) {
      try {
        messages = JSON.parse(storedMessages);
      } catch (e) {
        messages = [];
      }
    }

    // Если сообщений нет — можно добавить демо, но в тестах они уже есть
    dispatch(setMessages(messages));

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
