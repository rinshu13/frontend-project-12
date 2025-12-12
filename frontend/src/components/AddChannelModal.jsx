import React, { useEffect, useRef } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import leoProfanity from 'leo-profanity';
import { createChannel } from '../api';
import { setChannels, setCurrentChannelId } from '../features/channels/channelsSlice';
import { joinChannel } from '../socket';

const AddChannelSchema = Yup.object().shape({
  name: Yup.string()
    .min(3, 'Имя не короче 3 символов')  // ИЗМЕНЕНО: Добавьте i18n: t('modal.addErrorMin')
    .max(20, 'Имя не длиннее 20 символов')  // ИЗМЕНЕНО: t('modal.addErrorMax')
    .required('Имя канала обязательно'),  // ИЗМЕНЕНО: t('modal.addErrorRequired')
});

const AddChannelModal = ({ isOpen, onClose, onChannelCreated }) => {  // ИЗМЕНЕНО: Добавлен prop onChannelCreated для refetch в App
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
      const cleanName = leoProfanity.clean(values.name.trim());  // ИЗМЕНЕНО: Очистка мата заранее

      // Проверка мата после очистки (если изменилось)
      if (leoProfanity.check(values.name) && cleanName === values.name) {
        formik.setFieldError('name', t('modal.addErrorProfanity') || 'Нецензурное слово в имени канала');
        setSubmitting(false);
        return;
      }

      try {
        const response = await createChannel(cleanName);  // Передаём очищенное имя
        console.log('Create channel response:', response);  // Для отладки (удалите в проде)

        // ИЗМЕНЕНО: Парсинг JSONAPI-структуры Hexlet API
        const newChannelData = response.data?.data;  // { id, type: 'channels', attributes: { name }, ... }
        if (!newChannelData || !newChannelData.attributes?.name) {
          throw new Error('Invalid response structure');
        }

        const newChannel = {
          id: newChannelData.id,
          name: newChannelData.attributes.name,
          removable: true,  // Новые каналы removable
          private: false,
        };

        // Добавляем в Redux вручную (как раньше)
        dispatch(setChannels([...channels, newChannel]));
        dispatch(setCurrentChannelId(newChannel.id));
        joinChannel(newChannel.id);

        toast.success(t('toast.success.createChannel'));
        resetForm();
        onClose();

        // ИЗМЕНЕНО: Вызываем refetch в App для персистентности
        if (onChannelCreated) {
          onChannelCreated();
        }
      } catch (error) {
        console.error('Create channel error:', error);
        if (error.response?.status === 409) {
          formik.setFieldError('name', t('modal.addErrorUnique') || 'Имя канала уже существует');
        } else {
          // ИЗМЕНЕНО: Fallback — добавляем локально, если сервер упал (как дефолтные)
          const fallbackId = Date.now();  // Временный ID (заменится при refetch)
          const fallbackChannel = {
            id: fallbackId,
            name: cleanName,
            removable: true,
            private: false,
          };
          dispatch(setChannels([...channels, fallbackChannel]));
          dispatch(setCurrentChannelId(fallbackId));
          joinChannel(fallbackId);
          toast.warning(t('app.fallbackChannelCreated') || 'Канал создан локально (сервер недоступен)');

          resetForm();
          onClose();
          if (onChannelCreated) {
            onChannelCreated();  // Refetch попытается синхронизировать
          }
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