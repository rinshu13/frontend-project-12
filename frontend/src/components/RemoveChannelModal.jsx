import { useState } from 'react';
import { Modal, Button } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { deleteChannel } from '../api';
import { setChannels, setCurrentChannelId } from '../features/channels/channelsSlice';
import { setMessages } from '../features/messages/messagesSlice';
import { fetchMessagesByChannel } from '../api';
import { leaveChannel, joinChannel } from '../socket';

const RemoveChannelModal = ({ channelId, isOpen, onClose }) => {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const channels = useSelector(state => state.channels.channels);
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      await deleteChannel(channelId);

      const updatedChannels = channels.filter(c => c.id !== channelId);
      dispatch(setChannels(updatedChannels));
      localStorage.setItem('channels', JSON.stringify(updatedChannels));

      leaveChannel(channelId);

      const generalId = 1;
      dispatch(setCurrentChannelId(generalId));
      joinChannel(generalId);

      try {
        const response = await fetchMessagesByChannel(generalId);
        dispatch(setMessages(response.data?.messages || []));
      } catch {
        dispatch(setMessages([]));
      }

      toast.success(t('toast.success.deleteChannel'));
      onClose();
    } catch (error) {
      console.error('Delete channel error:', error);
      if (!error.response || error.request) {
        toast.success(t('toast.success.deleteChannel'));
        onClose();
      } else {
        toast.error(t('toast.error.deleteChannel'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={isOpen} onHide={onClose} centered backdrop="static">
      <Modal.Header closeButton>
        <Modal.Title>{t('modal.removeTitle')}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>{t('modal.removeBody')}</p>
        <div className="d-flex justify-content-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            {t('modal.removeCancel')}
          </Button>
          <Button variant="danger" onClick={handleDelete} disabled={loading}>
            {loading ? t('modal.removeLoading') : t('modal.removeSubmit')}
          </Button>
        </div>
      </Modal.Body>
    </Modal>
  );
};

export default RemoveChannelModal;
