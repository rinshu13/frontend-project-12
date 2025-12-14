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
    .min(3, 'Имя не короче 3 символов')
    .max(20, 'Имя не длиннее 20 символов')
    .required('Имя канала обязательно'),
});

const RenameChannelModal = ({ channel, isOpen, onClose }) => {
  const { t } = useTranslation();
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen && inputRef.current && channel) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isOpen, channel]);

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: { name: channel?.name || '' },
    validationSchema: RenameChannelSchema,
    onSubmit: async (values, { setSubmitting }) => {
      if (leoProfanity.check(values.name)) {
        formik.setFieldError('name', t('modal.renameErrorProfanity'));
        setSubmitting(false);
        return;
      }

      try {
        // Только REST-запрос на сервер — сервер сохранит новое имя
        await renameChannel(channel.id, values.name.trim());

        // УДАЛЕНО: локальное обновление Redux — оно не нужно для теста с reload
        // УДАЛЕНО: leaveChannel/joinChannel — они не нужны для rename

        toast.success(t('toast.success.renameChannel'));
        onClose(); // onClose вызовет refetchChannels в App.jsx → каналы обновятся с сервера
      } catch (error) {
        console.error('Rename error:', error);
        if (error.response?.status === 409) {
          formik.setFieldError('name', t('modal.renameErrorUnique'));
        } else {
          formik.setFieldError('name', t('modal.renameError'));
        }
      } finally {
        setSubmitting(false);
      }
    },
  });

  if (!isOpen || !channel) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <form onSubmit={formik.handleSubmit}>
          <div className="modal-header">
            <h5 className="modal-title">{t('modal.renameTitle')}</h5>
            <button className="modal-close" onClick={onClose} disabled={formik.isSubmitting}>
              ×
            </button>
          </div>
          <div className="modal-body">
            <div className="modal-form-group">
              <label className="modal-form-label">{t('modal.renameNameLabel')}</label>
              <input
                ref={inputRef}
                type="text"
                name="Имя канала"
                className={`modal-form-input ${formik.touched.name && formik.errors.name ? 'invalid' : ''}`}
                value={formik.values.name}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                disabled={formik.isSubmitting}
              />
              {formik.touched.name && formik.errors.name && (
                <div className="modal-invalid-feedback">{formik.errors.name}</div>
              )}
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="modal-btn modal-btn-secondary" onClick={onClose} disabled={formik.isSubmitting}>
              {t('modal.renameCancel')}
            </button>
            <button type="submit" className="modal-btn modal-btn-primary" disabled={formik.isSubmitting}>
              {formik.isSubmitting ? t('modal.renameLoading') : t('modal.renameSubmit')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RenameChannelModal;
