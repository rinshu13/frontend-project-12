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
    }
  }, [isOpen]);

  const formik = useFormik({
    initialValues: { name: '' },
    validationSchema: AddChannelSchema,
    onSubmit: async (values, { setSubmitting, resetForm }) => {
      const cleanName = leoProfanity.clean(values.name.trim());

      // Проверка на мат до отправки
      if (leoProfanity.check(values.name)) {
        formik.setFieldError('name', t('modal.addErrorProfanity'));
        setSubmitting(false);
        return;
      }

      try {
        // Отправляем на сервер
        await createChannel(cleanName);

        // Успех — сервер создал канал
        toast.success(t('toast.success.createChannel'));
        resetForm();
        onClose(); // ← Важно: onClose вызовет refetchChannels в App.jsx
      } catch (error) {
        console.error('Create channel error:', error);

        if (error.response?.status === 409) {
          // Конфликт — имя уже существует
          formik.setFieldError('name', t('modal.addErrorUnique'));
        } else if (error.message === 'Network Error' || !error.response) {
          // Оффлайн или сервер недоступен — информируем, но не создаём фейковый канал
          toast.error(t('toast.error.network'));
        } else {
          // Другие ошибки
          toast.error(t('toast.error.createChannel'));
        }
        setSubmitting(false);
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
            >
              ×
            </button>
          </div>
          <div className="modal-body">
            <div className="modal-form-group">
              <label className="modal-form-label">{t('modal.addNameLabel')}</label>
              <input
                ref={inputRef}
                type="text"
                name="name"
                className={`modal-form-input ${
                  formik.touched.name && formik.errors.name ? 'invalid' : ''
                }`}
                value={formik.values.name}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                disabled={formik.isSubmitting}
                autoFocus
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
              disabled={formik.isSubmitting}
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