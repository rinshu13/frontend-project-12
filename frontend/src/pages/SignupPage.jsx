import { useNavigate, Link } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { useFormik } from 'formik'
import { login } from '../features/auth/authSlice'
import api from '../api'
import signupSchema from '../validation/signupSchema'

const SignupPage = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { t } = useTranslation()

  const handleSubmit = async (values, { setSubmitting, setErrors }) => {
    try {
      const response = await api.post('/signup', {
        username: values.username,
        password: values.password,
      })

      const { token } = response.data
      if (!token || typeof token !== 'string') {
        throw new Error('Invalid token in response')
      }

      dispatch(login({ token, username: values.username }))
      navigate('/')
    }
    catch (err) {
      setSubmitting(false)
      if (err.response?.status === 409) {
        setErrors({ username: 'errors.conflict' })
      }
      else {
        setErrors({ username: 'errors.signup' })
      }
    }
  }

  const formik = useFormik({
    initialValues: {
      username: '',
      password: '',
      confirmPassword: '',
    },
    validationSchema: signupSchema,
    onSubmit: handleSubmit,
  })

  return (
    <div className="container py-5 h-100">
      <div className="row d-flex justify-content-center align-items-center h-100">
        <div className="col-12 col-md-8 col-lg-6 col-xl-5">
          <div className="card shadow-lg">
            <div className="card-body p-5">
              <h3 className="mb-5 text-center">{t('signup.title')}</h3>

              <form onSubmit={formik.handleSubmit} noValidate>
                <div className="mb-3">
                  <label htmlFor="username" className="form-label">
                    {t('signup.usernameLabel')}
                  </label>
                  <input
                    id="username"
                    type="text"
                    name="username"
                    placeholder={t('signup.usernameLabel')}
                    className={`form-control ${
                      formik.touched.username && formik.errors.username ? 'is-invalid' : ''
                    }`}
                    value={formik.values.username}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    autoFocus
                    required
                  />
                  {formik.touched.username && formik.errors.username && (
                    <div className="invalid-feedback">
                      {t(formik.errors.username)}
                    </div>
                  )}
                </div>

                <div className="mb-3">
                  <label htmlFor="password" className="form-label">
                    {t('signup.passwordLabel')}
                  </label>
                  <input
                    id="password"
                    type="password"
                    name="password"
                    placeholder={t('signup.passwordLabel')}
                    className={`form-control ${
                      formik.touched.password && formik.errors.password ? 'is-invalid' : ''
                    }`}
                    value={formik.values.password}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    required
                  />
                  {formik.touched.password && formik.errors.password && (
                    <div className="invalid-feedback">
                      {t(formik.errors.password)}
                    </div>
                  )}
                </div>

                <div className="mb-3">
                  <label htmlFor="confirmPassword" className="form-label">
                    {t('signup.confirmPasswordLabel')}
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    name="confirmPassword"
                    placeholder={t('signup.confirmPasswordLabel')}
                    className={`form-control ${
                      formik.touched.confirmPassword && formik.errors.confirmPassword ? 'is-invalid' : ''
                    }`}
                    value={formik.values.confirmPassword}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    required
                  />
                  {formik.touched.confirmPassword && formik.errors.confirmPassword && (
                    <div className="invalid-feedback">
                      {t(formik.errors.confirmPassword)}
                    </div>
                  )}
                </div>

                {/* Серверная ошибка (например, конфликт имени) */}
                {formik.errors.username && !formik.touched.username && (
                  <div className="alert alert-danger" role="alert">
                    {t(formik.errors.username)}
                  </div>
                )}

                <button
                  type="submit"
                  className="btn btn-primary w-100 mt-3"
                  disabled={formik.isSubmitting}
                >
                  {formik.isSubmitting
                    ? t('signup.loading') || 'Регистрация...'
                    : t('signup.submit')}
                </button>
              </form>

              <div className="text-center mt-4">
                {t('signup.loginLink')}
                {' '}
                <Link to="/login" className="link-primary text-decoration-none">
                  {t('login.title')}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SignupPage
