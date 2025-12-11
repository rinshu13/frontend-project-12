import React, { useEffect, useRef } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';  // Импорт для t
import { toast } from 'react-toastify';  // Импорт toast
import leoProfanity from 'leo-profanity';  // Импорт для фильтрации
import { renameChannel } from '../api';
import { setChannels } from '../features/channels/channelsSlice';
import { leaveChannel, joinChannel } from '../socket';

const RenameChannelSchema = Yup.object().shape({
  name: Yup.string()
    .min(3, 'Имя не короче 3 символов')
    .max(20, 'Имя не длиннее 20 символов')
    .required('Имя канала обязательно'),
});

const RenameChannelModal = ({ channel, isOpen, onClose }) => {
  const dispatch = useDispatch();
  const { t } = useTranslation();  // Переводы
  const channels = useSelector((state) => state.channels.channels);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.value = channel?.name || '';  // Set initial
    }
  }, [isOpen, channel]);

  const formik = useFormik({
    enableReinitialize: true,  // Re-init при open
    initialValues: { name: channel?.name || '' },
    validationSchema: RenameChannelSchema,
    onSubmit: async (values, { setSubmitting, resetForm }) => {
      // Фильтрация мата в имени канала
      if (leoProfanity.check(values.name)) {
        formik.setFieldError('name', t('modal.renameErrorProfanity') || 'Нецензурное слово в имени канала');
        return;
      }

      try {
        const response = await renameChannel(channel.id, values.name);
        const updatedChannel = response.data;
        const updatedChannels = channels.map((c) => (c.id === channel.id ? updatedChannel : c));
        dispatch(setChannels(updatedChannels));
        leaveChannel(channel.id);  // Leave old room
        joinChannel(channel.id);  // Re-join (server uses id, not name)
        toast.success(t('toast.success.renameChannel'));  // Success toast
        onClose();
        resetForm();
      } catch (error) {
        if (error.response?.status === 409) {
          formik.setFieldError('name', t('modal.renameErrorUnique') || 'Имя канала уже существует');
        } else {
          formik.setFieldError('name', t('modal.renameError') || 'Ошибка переименования');
        }
      } finally {
        setSubmitting(false);
      }
    },
  });

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !formik.isSubmitting) {
      formik.handleSubmit(e);
    }
  };

  if (!channel) return null;

  return (
    <Modal show={isOpen} onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>{t('modal.renameTitle')}</Modal.Title>
      </Modal.Header>
      <Form onSubmit={formik.handleSubmit} onKeyDown={handleKeyDown}>
        <Modal.Body>
          <Form.Group>
            <Form.Label>{t('modal.renameNameLabel')}</Form.Label>
            <Form.Control
              ref={inputRef}
              type="text"
              name="name"
              value={formik.values.name}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              isInvalid={formik.touched.name && !!formik.errors.name}
              disabled={formik.isSubmitting}
            />
            <Form.Control.Feedback type="invalid">
              {formik.errors.name}
            </Form.Control.Feedback>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onClose} disabled={formik.isSubmitting}>
            {t('modal.renameCancel')}
          </Button>
          <Button variant="primary" type="submit" disabled={formik.isSubmitting}>
            {formik.isSubmitting ? t('modal.renameLoading') : t('modal.renameSubmit')}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default RenameChannelModal;
