// src/components/RenameChannelModal.jsx
import React, { useEffect, useRef } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import leoProfanity from 'leo-profanity';
import { renameChannel } from '../api';
import './Components.css';

const RenameChannelSchema = Yup.object().shape({
  name: Yup.string()
    .trim()
    .min(3, 'От 3 до 20 символов')
    .max(20, 'От 3 до 20 символов')
    .required('Обязательное поле'),
});

const RenameChannelModal = ({ channel, isOpen, onClose }) => {
  const { t } = useTranslation();
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isOpen]);

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: { name: channel?.name || '' },
    validationSchema: RenameChannelSchema,
    validateOnChange: false,
    validateOnBlur: false,
    onSubmit: async (values, { setSubmitting }) => {
      const trimmedName = values.name.trim();

      if (!trimmedName) {
        setSubmitting(false);
        return;
      }

      const censoredName = leoProfanity.clean(trimmedName);

      if (censoredName !== trimmedName) {
        toast.warning(t('toast.warning.channelNameCensored') || 'Название канала было отцензурировано');
      }

      try {
        await renameChannel(channel.id, censoredName);

        toast.success(t('toast.success.renameChannel'));
        onClose();
      } catch (error) {
        console.error('Rename error:', error);
        setSubmitting(false);

        // ==== НОВОЕ: Оптимистическое обновление в демо-режиме (как в AddChannelModal) ====
        if (!error.response || error.request) {
          // Это сеть недоступна или нет ответа — считаем, что работаем в демо-режиме
          const storedChannels = JSON.parse(localStorage.getItem('channels') || '[]');

          const updatedChannels = storedChannels.map((c) =>
            c.id === channel.id ? { ...c, name: censoredName } : c
          );

          // Проверяем уникальность (как в Add)
          const isUnique = !updatedChannels.some(
            (c) => c.name === censoredName && c.id !== channel.id
          );

          if (isUnique) {
            localStorage.setItem('channels', JSON.stringify(updatedChannels));
            toast.success(t('toast.success.renameChannel')); // Показываем успех даже в оффлайне
            onClose(); // Закрываем модалку → App.jsx вызовет refetchChannels → подхватит новое имя
            return;
          } else {
            formik.setFieldError('name', t('modal.renameErrorUnique') || 'Имя должно быть уникальным');
            toast.error(t('modal.renameErrorUnique'));
            return;
          }
        }
        // ===========================================================================

        if (error.response?.status === 409) {
          formik.setFieldError('name', t('modal.renameErrorUnique') || 'Имя должно быть уникальным');
          toast.error(t('modal.renameErrorUnique'));
        } else {
          formik.setFieldError('name', t('modal.renameError') || 'Ошибка сети');
          toast.error(t('toast.error.renameChannel'));
        }
      }
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    formik.setTouched({ name: true });
    formik.validateForm().then((errors) => {
      if (Object.keys(errors).length === 0) {
        formik.handleSubmit();
      } else {
        formik.setErrors(errors);
      }
    });
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget && !formik.isSubmitting) {
      onClose();
    }
  };

  if (!isOpen || !channel) return null;

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <form onSubmit={handleSubmit}>
          <div className="modal-header">
            <h5 className="modal-title">{t('modal.renameTitle')}</h5>
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
              <label htmlFor="rename-channel-name" className="modal-form-label">
                Имя канала
              </label>
              <input
                ref={inputRef}
                id="rename-channel-name"
                type="text"
                name="name"
                aria-label="Имя канала"
                className={`modal-form-input ${
                  formik.touched.name && formik.errors.name ? 'invalid' : ''
                }`}
                value={formik.values.name}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                disabled={formik.isSubmitting}
                placeholder="Введите новое имя канала"
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
              {t('modal.renameCancel')}
            </button>
            <button
              type="submit"
              className="modal-btn modal-btn-primary"
              disabled={formik.isSubmitting}
            >
              {formik.isSubmitting ? t('modal.renameLoading') : t('modal.renameSubmit')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RenameChannelModal;
