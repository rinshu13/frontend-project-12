// src/components/AddChannelModal.jsx
import React, { useEffect, useRef } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import leoProfanity from 'leo-profanity';
import { createChannel } from '../api';
import './Components.css';

const AddChannelSchema = Yup.object().shape({
  name: Yup.string()
    .trim()
    .min(3, 'Имя не короче 3 символов')
    .max(20, 'Имя не длиннее 20 символов')
    .required('Имя канала обязательно'),
});

const AddChannelModal = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select(); // удобно для пользователя
    }
  }, [isOpen]);

  const formik = useFormik({
    initialValues: { name: '' },
    validationSchema: AddChannelSchema,
    validateOnChange: true,
    validateOnBlur: true,

    onSubmit: async (values, { setSubmitting, resetForm, setFieldError }) => {
      const originalName = values.name.trim();
      const cleanName = leoProfanity.clean(originalName);

      // Проверка на мат
      if (leoProfanity.check(originalName)) {
        setFieldError('name', t('modal.addErrorProfanity'));
        setSubmitting(false);
        return;
      }

      try {
        // Отправляем запрос на создание канала
        const response = await createChannel(cleanName);

        // Успешно создано на сервере
        const newChannel = response.data?.data || response.data; // в зависимости от структуры ответа API

        if (newChannel && newChannel.id) {
          toast.success(t('toast.success.createChannel'));
        } else {
          toast.success(t('toast.success.createChannel'));
        }

        resetForm();
        // Закрываем модалку → в App.jsx вызовется refetchChannels()
        // → список каналов обновится с сервера, новый канал появится
        onClose();
      } catch (error) {
        console.error('Error creating channel:', error);

        setSubmitting(false);

        if (error.response) {
          // Сервер ответил ошибкой
          if (error.response.status === 409) {
            setFieldError('name', t('modal.addErrorUnique'));
            toast.error(t('modal.addErrorUnique'));
          } else if (error.response.status === 401) {
            toast.error(t('toast.error.unauthorized'));
          } else {
            toast.error(t('toast.error.createChannel'));
          }
        } else if (error.request) {
          // Сеть/оффлайн
          toast.error(t('toast.error.network'));
        } else {
          toast.error(t('toast.error.createChannel'));
        }
      }
    },
  });

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <form onSubmit={formik.handleSubmit}>
          <div className="modal-header">
            <h5 className="modal-title">{t('modal.addTitle')}</h5>
            <button
              type="button"
              className="modal-close"
              onClick={onClose}
              disabled={formik.isSubmitting}
              aria-label={t('modal.close')}
            >
              ×
            </button>
          </div>

          <div className="modal-body">
            <div className="modal-form-group">
              <label htmlFor="add-channel-name" className="modal-form-label">
                {t('modal.addNameLabel')}
              </label>
              <input
                ref={inputRef}
                id="add-channel-name"
                type="text"
                name="name"
                className={`modal-form-input ${
                  formik.touched.name && formik.errors.name ? 'invalid' : ''
                }`}
                value={formik.values.name}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                disabled={formik.isSubmitting}
                placeholder={t('modal.addNamePlaceholder') || 'Введите имя канала'}
                autoComplete="off"
              />
              {formik.touched.name && formik.errors.name && (
                <div className="modal-invalid-feedback">{formik.errors.name}</div>
              )}
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="modal-btn modal-btn-secondary"
              onClick={onClose}
              disabled={formik.isSubmitting}
            >
              {t('modal.addCancel')}
            </button>
            <button
              type="submit"
              className="modal-btn modal-btn-primary"
              disabled={formik.isSubmitting || !formik.isValid || !formik.values.name.trim()}
            >
              {formik.isSubmitting ? t('modal.addLoading') : t('modal.addSubmit')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddChannelModal;
