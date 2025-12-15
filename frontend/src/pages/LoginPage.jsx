import { useState } from 'react'
import { useFormik } from 'formik'
import * as Yup from 'yup'
import { useDispatch } from 'react-redux'
import { useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { login } from '../features/auth/authSlice'
import { loginUser } from '../api'
import './AuthPages.css'

const LoginPage = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [authError, setAuthError] = useState(null)
  const [loading, setLoading] = useState(false)

  const LoginSchema = Yup.object().shape({
    username: Yup.string()
      .min(3, t('errors.min3'))
      .required(t('errors.required')),
    password: Yup.string()
      .required(t('errors.required')),
  })

  const formik = useFormik({
    initialValues: {
      username: '',
      password: '',
    },
    validationSchema: LoginSchema,
    onSubmit: async (values) => {
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
    },
  })

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">
          Войти
        </h1>

        <form onSubmit={formik.handleSubmit} noValidate>
          <div className="form-group">
            <label htmlFor="username" className="form-label">
              Ваш ник
            </label>
            <input
              id="username"
              type="text"
              name="username"
              placeholder="Ваш ник"
              className={`form-input ${formik.touched.username && formik.errors.username ? 'invalid' : ''}`}
              value={formik.values.username}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              disabled={loading}
              autoFocus
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">
              Пароль
            </label>
            <input
              id="password"
              type="password"
              name="password"
              placeholder="Пароль"
              className={`form-input ${formik.touched.password && formik.errors.password ? 'invalid' : ''}`}
              value={formik.values.password}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              disabled={loading}
              required
            />
          </div>

          {authError && (
            <div className="alert-danger">
              {authError}
            </div>
          )}

          <button
            type="submit"
            className="auth-button"
            disabled={loading || !formik.dirty}
          >
            {loading ? 'Вход...' : 'Войти'}
          </button>
        </form>

        <div className="text-center mt-4">
          Нет аккаунта?
          <Link to="/signup" className="link">
            Регистрация
          </Link>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
