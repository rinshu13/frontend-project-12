import { useEffect, useRef } from 'react'
import { useFormik } from 'formik'
import * as Yup from 'yup'
import { useTranslation } from 'react-i18next'
import { toast } from 'react-toastify'
import leoProfanity from 'leo-profanity'
import { createChannel } from '../api'
import './Components.css'

const AddChannelSchema = Yup.object().shape({
  name: Yup.string()
    .trim()
    .min(3, 'От 3 до 20 символов')
    .max(20, 'От 3 до 20 символов')
    .required('Имя канала обязательно'),
})

const AddChannelModal = ({ isOpen, onClose }) => {
  const { t } = useTranslation()
  const inputRef = useRef(null)

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isOpen])

  const formik = useFormik({
    initialValues: { name: '' },
    validationSchema: AddChannelSchema,
    validateOnChange: false,
    validateOnBlur: true,
    onSubmit: async (values, { setSubmitting, resetForm, setFieldError }) => {
      const originalName = values.name.trim()
      if (!originalName) return

      const censoredName = leoProfanity.clean(originalName)

      if (censoredName !== originalName) {
        toast.warning(t('toast.warning.channelNameCensored') || 'Название канала было отцензурировано')
      }

      try {
        const response = await createChannel(censoredName)
        const newChannel = response.data?.data || response.data

        let newChannelId

        if (newChannel && newChannel.id) {
          newChannelId = newChannel.id
        } else {
          const storedChannels = JSON.parse(localStorage.getItem('channels') || '[]')
          newChannelId = Math.max(...storedChannels.map((c) => c.id || 0), 0) + 1

          const localChannel =
            {
              id: newChannelId,
              name: censoredName,
              removable: true,
            }

          if (!storedChannels.some((c) => c.name === censoredName)) {
            storedChannels.push(localChannel)
            localStorage.setItem('channels', JSON.stringify(storedChannels))
          }
        }

        toast.success(t('toast.success.createChannel'))
        resetForm()
        onClose(newChannelId) // Переключаемся на новый канал
      } catch (error) {
        console.error('Error creating channel:', error)
        setSubmitting(false)

        if (error.response) {
          if (error.response.status === 409) {
            setFieldError('name', t('modal.addErrorUnique'))
            toast.error(t('modal.addErrorUnique'))
          } else if (error.response.status === 401) {
            toast.error(t('toast.error.unauthorized'))
          } else {
            toast.error(t('toast.error.createChannel'))
          }
        } else if (error.request) {
          toast.error(t('toast.error.network'))
        } else {
          toast.error(t('toast.error.createChannel'))
        }
      }
    },
  })

  const handleClose = (e) => {
    e?.stopPropagation()
    if (!formik.isSubmitting) {
      onClose()
    }
  }

  const handleSubmitWithValidation = (e) => {
    e.preventDefault()
    formik.setTouched({ name: true })
    formik.validateForm().then((errors) => {
      if (Object.keys(errors).length === 0) {
        formik.handleSubmit(e)
      } else {
        formik.setErrors(errors)
      }
    })
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <form onSubmit={handleSubmitWithValidation}>
          <div className="modal-header">
            <h5 className="modal-title">
              {t('modal.addTitle')}
            </h5>
            <button
              type="button"
              className="modal-close"
              onClick={handleClose}
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
                <div className="modal-invalid-feedback">
                  {formik.errors.name}
                </div>
              )}
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="modal-btn modal-btn-secondary"
              onClick={handleClose}
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
  )
}

export default AddChannelModal
