import { useEffect, useRef } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import leoProfanity from 'leo-profanity';
import { renameChannel } from '../api';

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
      if (!trimmedName || trimmedName === channel?.name) {
        onClose();
        return;
      }

      const censoredName = leoProfanity.clean(trimmedName);

      if (censoredName !== trimmedName) {
        toast.warning(t('toast.warning.channelNameCensored') || 'Название канала было отцензурировано');
      }

      try {
        await renameChannel(channel.id, censoredName);

        const storedChannels = JSON.parse(localStorage.getItem('channels') || '[]');
        const isUnique = !storedChannels.some(c => c.name === censoredName && c.id !== channel.id);

        if (isUnique) {
          const updatedChannels = storedChannels.map(c =>
            c.id === channel.id ? { ...c, name: censoredName } : c
          );
          localStorage.setItem('channels', JSON.stringify(updatedChannels));
        } else {
          throw { response: { status: 409 } };
        }

        toast.success(t('toast.success.renameChannel'));
        onClose();
      } catch (error) {
        console.error('Rename error:', error);
        setSubmitting(false);

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

  return (
    <Modal show={isOpen} onHide={onClose} centered backdrop="static">
      <Modal.Header closeButton>
        <Modal.Title>{t('modal.renameTitle')}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={formik.handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Имя канала</Form.Label>
            <Form.Control
              ref={inputRef}
              name="name"
              type="text"
              value={formik.values.name}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              isInvalid={formik.touched.name && !!formik.errors.name}
              disabled={formik.isSubmitting}
              autoFocus
            />
            <Form.Control.Feedback type="invalid">
              {formik.errors.name}
            </Form.Control.Feedback>
          </Form.Group>
          <div className="d-flex justify-content-end gap-2">
            <Button variant="secondary" onClick={onClose} disabled={formik.isSubmitting}>
              {t('modal.renameCancel')}
            </Button>
            <Button type="submit" variant="primary" disabled={formik.isSubmitting}>
              {formik.isSubmitting ? t('modal.renameLoading') : t('modal.renameSubmit')}
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

export default RenameChannelModal;
