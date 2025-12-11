import React, { useState } from 'react';
import { Modal, Button } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { deleteChannel } from '../api';
import { setChannels, setCurrentChannelId } from '../features/channels/channelsSlice';
import { setMessages } from '../features/messages/messagesSlice';
import { fetchMessagesByChannel } from '../api';
import { leaveChannel } from '../socket';
import { joinChannel } from '../socket';

const RemoveChannelModal = ({ channelId, isOpen, onClose }) => {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const channels = useSelector((state) => state.channels.channels);
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      await deleteChannel(channelId);
      const updatedChannels = channels.filter((c) => c.id !== channelId);
      dispatch(setChannels(updatedChannels));
      leaveChannel(channelId);
      const generalId = 1;
      dispatch(setCurrentChannelId(generalId));
      joinChannel(generalId);
      const response = await fetchMessagesByChannel(generalId);
      dispatch(setMessages(response.data.messages));
      toast.success(t('toast.success.deleteChannel'));
      onClose();
    } catch (error) {
      console.error('Delete channel error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={isOpen} onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>{t('modal.removeTitle')}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>{t('modal.removeBody')}</p>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose} disabled={loading}>
          {t('modal.removeCancel')}
        </Button>
        <Button variant="danger" onClick={handleDelete} disabled={loading}>
          {loading ? t('modal.removeLoading') : t('modal.removeSubmit')}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default RemoveChannelModal;
