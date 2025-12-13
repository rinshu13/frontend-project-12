// src/components/AddChannelModal.jsx
import React, { useEffect, useRef } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import leoProfanity from 'leo-profanity';
import { createChannel } from '../api';
import { setChannels, setCurrentChannelId } from '../features/channels/channelsSlice';
import { joinChannel } from '../socket';
import './Components.css';

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
        formik.setFieldError('name', t('modal.addErrorProfanity'));
        setSubmitting(false);
        return;
      }

      try {
        const response = await createChannel(cleanName);
        const newChannelData = response.data?.data;
        const newChannel = {
          id: newChannelData.id,
          name: newChannelData.attributes.name,
          removable: true,
          private: false,
        };

        dispatch(setChannels([...channels, newChannel]));
        dispatch(setCurrentChannelId(newChannel.id));
        joinChannel(newChannel.id);
        localStorage.setItem('channels', JSON.stringify([...channels, newChannel]));

        toast.success(t('toast.success.createChannel'));
        resetForm();
        onClose();
      } catch (error) {
        console.error('Create channel error:', error);
        if (error.response?.status === 409) {
          formik.setFieldError('name', t('modal.addErrorUnique'));
        } else {
          const fallbackId = Date.now();
          const fallbackChannel = { id: fallbackId, name: cleanName, removable: true, private: false };
          const updated = [...channels, fallbackChannel];
          dispatch(setChannels(updated));
          dispatch(setCurrentChannelId(fallbackId));
          joinChannel(fallbackId);
          localStorage.setItem('channels', JSON.stringify(updated));
          toast.warning(t('app.fallbackChannelCreated'));
          resetForm();
          onClose();
        }
      } finally {
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
            <button className="modal-close" onClick={onClose} disabled={formik.isSubmitting}>
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
              {t('modal.addCancel')}
            </button>
            <button type="submit" className="modal-btn modal-btn-primary" disabled={formik.isSubmitting}>
              {formik.isSubmitting ? t('modal.addLoading') : t('modal.addSubmit')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddChannelModal;