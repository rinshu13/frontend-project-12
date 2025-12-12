import React, { useEffect, useRef } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import leoProfanity from 'leo-profanity';
import { createChannel } from '../api';  // Попытка API, fallback локально
import { setChannels, setCurrentChannelId } from '../features/channels/channelsSlice';
import { joinChannel } from '../socket';

const AddChannelSchema = Yup.object().shape({
  name: Yup.string()
    .min(3, 'Имя не короче 3 символов')
    .max(20, 'Имя не длиннее 20 символов')
    .required('Имя канала обязательно'),
});

const AddChannelModal = ({ isOpen, onClose }) => {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const channels = useSelector((state) => state.channels.channels);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const formik = useFormik({
    initialValues: { name: '' },
    validationSchema: AddChannelSchema,
    onSubmit: async (values, { setSubmitting, resetForm }) => {
      const cleanName = leoProfanity.clean(values.name.trim());

      if (leoProfanity.check(values.name)) {
        formik.setFieldError('name', t('modal.addErrorProfanity') || 'Нецензурное слово в имени канала');
        setSubmitting(false);
        return;
      }

      try {
        const response = await createChannel(cleanName);
        console.log('Create channel response:', response);

        // Парсинг JSONAPI
        const newChannelData = response.data?.data;
        if (!newChannelData || !newChannelData.attributes?.name) {
          throw new Error('Invalid response structure');
        }

        const newChannel = {
          id: newChannelData.id,
          name: newChannelData.attributes.name,
          removable: true,
          private: false,
        };

        dispatch(setChannels([...channels, newChannel]));
        dispatch(setCurrentChannelId(newChannel.id));
        joinChannel(newChannel.id);

        // Сохранение в localStorage
        const updatedChannels = [...channels, newChannel];
        localStorage.setItem('channels', JSON.stringify(updatedChannels));

        toast.success(t('toast.success.createChannel'));
        resetForm();
        onClose();
      } catch (error) {
        console.error('Create channel error:', error);
        if (error.response?.status === 409) {
          formik.setFieldError('name', t('modal.addErrorUnique') || 'Имя канала уже существует');
        } else {
          // Fallback: Добавляем локально в localStorage
          const fallbackId = Date.now();  // Уникальный ID
          const fallbackChannel = {
            id: fallbackId,
            name: cleanName,
            removable: true,
            private: false,
          };
          const updatedChannels = [...channels, fallbackChannel];
          dispatch(setChannels(updatedChannels));
          dispatch(setCurrentChannelId(fallbackId));
          joinChannel(fallbackId);
          localStorage.setItem('channels', JSON.stringify(updatedChannels));  // Сохраняем локально
          toast.warning(t('app.fallbackChannelCreated') || 'Канал создан локально');

          resetForm();
          onClose();
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

  return (
    <Modal show={isOpen} onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>{t('modal.addTitle')}</Modal.Title>
      </Modal.Header>
      <Form onSubmit={formik.handleSubmit} onKeyDown={handleKeyDown}>
        <Modal.Body>
          <Form.Group>
            <Form.Label>{t('modal.addNameLabel')}</Form.Label>
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
            {t('modal.addCancel')}
          </Button>
          <Button variant="primary" type="submit" disabled={formik.isSubmitting}>
            {formik.isSubmitting ? t('modal.addLoading') : t('modal.addSubmit')}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default AddChannelModal;