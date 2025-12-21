import { useState } from 'react'
import { useFormik } from 'formik'
import { useDispatch } from 'react-redux'
import { useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { login } from '../store/auth/authSlice'
import { loginUser } from '../api'
import loginSchema from '../validation/loginSchema'

const LoginPage = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [authError, setAuthError] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (values) => {
    setAuthError(null)
    setLoading(true)

    try {
      const response = await loginUser(values)
      const { token, username } = response.data

      if (!token || !username) {
        throw new Error('Invalid response data')
      }

      dispatch(login({ token, username }))
      localStorage.setItem('token', token)
      localStorage.setItem('username', username)

      navigate('/')
    }
    catch (err) {
      console.error('Login error:', err)
      if (err.response?.status === 401) {
        setAuthError('Неверные имя пользователя или пароль')
      }
      else {
        setAuthError(t('errors.network') || 'Ошибка сети или сервера. Попробуйте позже.')
      }
    }
    finally {
      setLoading(false)
    }
  }

  const formik = useFormik({
    initialValues: {
      username: '',
      password: '',
    },
    validationSchema: loginSchema(t),
    onSubmit: handleSubmit,
  })

  return (
    <div className="container py-5 h-100">
      <div className="row d-flex justify-content-center align-items-center h-100">
        <div className="col-12 col-md-8 col-lg-6 col-xl-5">
          <div className="card shadow-lg">
            <div className="card-body p-5">
              <h3 className="mb-5 text-center">{t('login.title') || 'Войти'}</h3>

              <form onSubmit={formik.handleSubmit} noValidate>
                <div className="mb-3">
                  <label htmlFor="username" className="form-label">
                    {t('login.usernameLabel') || 'Ваш ник'}
                  </label>
                  <input
                    id="username"
                    type="text"
                    name="username"
                    placeholder={t('login.usernameLabel') || 'Ваш ник'}
                    className={`form-control ${
                      formik.touched.username && formik.errors.username ? 'is-invalid' : ''
                    }`}
                    value={formik.values.username}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    disabled={loading}
                    autoFocus
                    required
                  />
                </div>

                <div className="mb-3">
                  <label htmlFor="password" className="form-label">
                    {t('login.passwordLabel') || 'Пароль'}
                  </label>
                  <input
                    id="password"
                    type="password"
                    name="password"
                    placeholder={t('login.passwordLabel') || 'Пароль'}
                    className={`form-control ${
                      formik.touched.password && formik.errors.password ? 'is-invalid' : ''
                    }`}
                    value={formik.values.password}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    disabled={loading}
                    required
                  />
                </div>

                {authError && (
                  <div className="alert alert-danger" role="alert">
                    {authError}
                  </div>
                )}

                <button
                  type="submit"
                  className="btn btn-primary w-100 mt-3"
                  disabled={loading || !formik.dirty}
                >
                  {loading ? t('login.loading') || 'Вход...' : t('login.submit') || 'Войти'}
                </button>
              </form>

              <div className="text-center mt-4">
                {t('login.noAccount') || 'Нет аккаунта?'}
                {' '}
                <Link to="/signup" className="link-primary text-decoration-none">
                  {t('login.signupLink') || 'Регистрация'}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
