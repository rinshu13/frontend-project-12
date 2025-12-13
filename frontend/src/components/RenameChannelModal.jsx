// src/components/RenameChannelModal.jsx
import React, { useEffect, useRef } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import leoProfanity from 'leo-profanity';
import { renameChannel } from '../api';
import { setChannels } from '../features/channels/channelsSlice';
import { leaveChannel, joinChannel } from '../socket';
import './Components.css';

const RenameChannelSchema = Yup.object().shape({
  name: Yup.string()
    .min(3, 'Имя не короче 3 символов')
    .max(20, 'Имя не длиннее 20 символов')
    .required('Имя канала обязательно'),
});

const RenameChannelModal = ({ channel, isOpen, onClose }) => {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const channels = useSelector((state) => state.channels.channels);
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
        return;
      }

      try {
        await renameChannel(channel.id, values.name.trim());
        const updatedChannels = channels.map((c) =>
          c.id === channel.id ? { ...c, name: values.name.trim() } : c
        );
        dispatch(setChannels(updatedChannels));
        leaveChannel(channel.id);
        joinChannel(channel.id);
        toast.success(t('toast.success.renameChannel'));
        onClose();
      } catch (error) {
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
                name="name"
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