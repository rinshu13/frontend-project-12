import React from 'react';
import { Modal, Button } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { deleteChannel } from '../api';
import { setChannels, setCurrentChannelId } from '../features/channels/channelsSlice';
import { setMessages } from '../features/messages/messagesSlice';
import { fetchMessagesByChannel } from '../api';
import { leaveChannel } from '../socket';
import { joinChannel } from '../socket';

const RemoveChannelModal = ({ channelId, isOpen, onClose }) => {
  const dispatch = useDispatch();
  const channels = useSelector((state) => state.channels.channels);
  const [loading, setLoading] = React.useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      await deleteChannel(channelId);
      const updatedChannels = channels.filter((c) => c.id !== channelId);
      dispatch(setChannels(updatedChannels));
      leaveChannel(channelId);  // Leave room
      const generalId = 1;  // Дефолт #general
      dispatch(setCurrentChannelId(generalId));
      joinChannel(generalId);
      const response = await fetchMessagesByChannel(generalId);
      dispatch(setMessages(response.data.messages));
      onClose();
    } catch (error) {
      console.error('Delete channel error:', error);
      // Alert error, но по UX — console
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={isOpen} onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Удалить канал?</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>Подтвердите удаление канала. Это действие нельзя отменить.</p>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose} disabled={loading}>
          Отменить
        </Button>
        <Button variant="danger" onClick={handleDelete} disabled={loading}>
          {loading ? 'Удаление...' : 'Удалить'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default RemoveChannelModal;
