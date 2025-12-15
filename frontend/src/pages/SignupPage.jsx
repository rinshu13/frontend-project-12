import { useNavigate, Link } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { useFormik } from 'formik'
import { login } from '../features/auth/authSlice'
import api from '../api'
import signupSchema from '../validation/signupSchema'
import './AuthPages.css'

const SignupPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { t } = useTranslation();

  const handleSubmit = async (values, { setSubmitting, setErrors }) => {
    try {
      const response = await api.post('/signup', {
        username: values.username,
        password: values.password,
      });

      const { token } = response.data;
      if (!token || typeof token !== 'string') {
        throw new Error('Invalid token in response');
      }

      dispatch(login({ token, username: values.username }));
      navigate('/');
    } catch (err) {
      setSubmitting(false);
      if (err.response?.status === 409) {
        setErrors({ username: 'errors.conflict' });
      } else {
        setErrors({ username: 'errors.signup' });
      }
    }
  };

  const formik = useFormik({
    initialValues: {
      username: '',
      password: '',
      confirmPassword: '',
    },
    validationSchema: signupSchema,
    onSubmit: handleSubmit,
  });

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">{t('signup.title')}</h1>

        <form onSubmit={formik.handleSubmit} noValidate>
          <div className="form-group">
            <label htmlFor="username" className="form-label">
              {t('signup.usernameLabel')}
            </label>
            <input
              id="username"
              type="text"
              name="username"
              placeholder={t('signup.usernameLabel')}
              className={`form-input ${formik.touched.username && formik.errors.username ? 'invalid' : ''}`}
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

          <div className="form-group">
            <label htmlFor="password" className="form-label">
              {t('signup.passwordLabel')}
            </label>
            <input
              id="password"
              type="password"
              name="password"
              placeholder={t('signup.passwordLabel')}
              className={`form-input ${formik.touched.password && formik.errors.password ? 'invalid' : ''}`}
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

          <div className="form-group">
            <label htmlFor="confirmPassword" className="form-label">
              {t('signup.confirmPasswordLabel')}
            </label>
            <input
              id="confirmPassword"
              type="password"
              name="confirmPassword"
              placeholder={t('signup.confirmPasswordLabel')}
              className={`form-input ${formik.touched.confirmPassword && formik.errors.confirmPassword ? 'invalid' : ''}`}
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

          <button
            type="submit"
            className="auth-button"
            disabled={formik.isSubmitting}
          >
            {t('signup.submit')}
          </button>
        </form>

        <p className="text-center mt-4">
          {t('signup.loginLink')}
          <Link to="/login" className="link">
            {t('login.title')}
          </Link>
        </p>
      </div>
    </div>
  );
};

export default SignupPage
