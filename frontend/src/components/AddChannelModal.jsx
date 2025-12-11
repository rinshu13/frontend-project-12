import React, { useEffect, useRef } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import { useFormik } from 'formik';
import * as Yup from 'yap';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';  // Импорт для t
import { toast } from 'react-toastify';  // Импорт toast
import leoProfanity from 'leo-profanity';  // Импорт для фильтрации
import { createChannel } from '../api';
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
  const { t } = useTranslation();  // Переводы
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
      // Фильтрация мата в имени канала
      if (leoProfanity.check(values.name)) {
        formik.setFieldError('name', t('modal.addErrorProfanity') || 'Нецензурное слово в имени канала');
        return;
      }

      try {
        const response = await createChannel(values.name);
        const newChannel = response.data;  // {id, name, removable: true}
        dispatch(setChannels([...channels, newChannel]));
        dispatch(setCurrentChannelId(newChannel.id));  // Перемести в новый
        joinChannel(newChannel.id);  // Join room
        toast.success(t('toast.success.createChannel'));  // Success toast
        onClose();
        resetForm();
      } catch (error) {
        if (error.response?.status === 409) {
          formik.setFieldError('name', t('modal.addErrorUnique') || 'Имя канала уже существует');
        } else {
          formik.setFieldError('name', t('modal.addError') || 'Ошибка создания канала');
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
