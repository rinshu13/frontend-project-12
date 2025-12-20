import { useEffect, useRef } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import { useFormik } from 'formik';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import leoProfanity from 'leo-profanity';
import { createChannel } from '../api';
import addChannelSchema from '../validation/addChannelSchema';

const AddChannelModal = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isOpen]);

  const formik = useFormik({
    initialValues: { name: '' },
    validationSchema: addChannelSchema,
    validateOnChange: false,
    validateOnBlur: true,
    onSubmit: async (values, { setSubmitting, resetForm, setFieldError }) => {
      const originalName = values.name.trim();
      if (!originalName) return;

      const censoredName = leoProfanity.clean(originalName);

      if (censoredName !== originalName) {
        toast.warning(t('toast.warning.channelNameCensored') || 'Название канала было отцензурировано');
      }

      try {
        const response = await createChannel(censoredName);
        const newChannel = response.data?.data || response.data;

        let newChannelId;

        if (newChannel && newChannel.id) {
          newChannelId = newChannel.id;
        } else {
          const storedChannels = JSON.parse(localStorage.getItem('channels') || '[]');
          newChannelId = Math.max(...storedChannels.map(c => c.id || 0), 0) + 1;

          const localChannel = { id: newChannelId, name: censoredName, removable: true };

          if (!storedChannels.some(c => c.name === censoredName)) {
            storedChannels.push(localChannel);
            localStorage.setItem('channels', JSON.stringify(storedChannels));
          }
        }

        toast.success(t('toast.success.createChannel'));
        resetForm();
        onClose(newChannelId);
      } catch (error) {
        console.error('Error creating channel:', error);
        setSubmitting(false);

        if (error.response?.status === 409) {
          setFieldError('name', t('modal.addErrorUnique'));
          toast.error(t('modal.addErrorUnique'));
        } else if (error.response?.status === 401) {
          toast.error(t('toast.error.unauthorized'));
        } else {
          toast.error(t('toast.error.createChannel'));
        }
      }
    },
  });

  return (
    <Modal show={isOpen} onHide={() => onClose(null)} centered backdrop="static">
      <Modal.Header closeButton>
        <Modal.Title>{t('modal.addTitle')}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={formik.handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>{t('modal.addNameLabel')}</Form.Label>
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
              aria-label={t('modal.addNameLabel') || 'Имя канала'}
            />
            <Form.Control.Feedback type="invalid">
              {formik.errors.name}
            </Form.Control.Feedback>
          </Form.Group>
          <div className="d-flex justify-content-end gap-2">
            <Button
              variant="secondary"
              onClick={() => onClose(null)}
              disabled={formik.isSubmitting}
            >
              {t('modal.addCancel')}
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={formik.isSubmitting}
              data-testid="add-channel-submit"
            >
              {formik.isSubmitting ? t('modal.addLoading') : t('modal.addSubmit')}
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

export default AddChannelModal;
