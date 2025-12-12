import React, { useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { login } from '../features/auth/authSlice';
import api from '../api';
import { Form, Button, Container, Row, Col } from 'react-bootstrap';

const LoginPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [authError, setAuthError] = useState(null); // Ошибка аутентификации (401)
  const [loading, setLoading] = useState(false);

  const LoginSchema = Yup.object().shape({
    username: Yup.string()
      .min(3, t('errors.min3'))
      .required(t('errors.required')),
    password: Yup.string()
      .min(6, t('errors.min6'))
      .required(t('errors.required')),
  });

  const formik = useFormik({
    initialValues: {
      username: '',
      password: '',
    },
    validationSchema: LoginSchema,
    onSubmit: async (values) => {
      setAuthError(null);
      setLoading(true);
      try {
        const response = await api.post('/api/v1/login', values);
        const { token, username } = response.data;
        dispatch(login({ token, username }));
        navigate('/');
      } catch (err) {
        if (err.response?.status === 401) {
          setAuthError('Неверные имя пользователя или пароль');
        } else {
          setAuthError(t('errors.network') || 'Ошибка сети. Попробуйте позже.');
        }
      } finally {
        setLoading(false);
      }
    },
  });

  // При ошибке аутентификации поля становятся invalid (красная обводка и !)
  const hasAuthError = !!authError;
  const isUsernameInvalid = hasAuthError || (formik.touched.username && !!formik.errors.username);
  const isPasswordInvalid = hasAuthError || (formik.touched.password && !!formik.errors.password);

  return (
    <Container className="login-page">
      <Row className="justify-content-md-center">
        <Col md={6}>
          <h1 className="text-center mb-4">Войти</h1>

          {authError && (
            <div className="mb-3 p-3 text-white bg-danger rounded">
              {authError}
            </div>
          )}

          <Form onSubmit={formik.handleSubmit}>
            <Form.Group className="mb-3 position-relative">
              <Form.Label>Ваш ник</Form.Label>
              <Form.Control
                type="text"
                name="username"
                value={formik.values.username}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                isInvalid={isUsernameInvalid}
                disabled={loading}
                className="pe-5" // Отступ для иконки !
              />
              {isUsernameInvalid && (
                <div className="position-absolute end-0 top-50 translate-middle-y me-3 text-danger">
                  !
                </div>
              )}
              <Form.Control.Feedback type="invalid">
                {formik.errors.username}
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-3 position-relative">
              <Form.Label>Пароль</Form.Label>
              <Form.Control
                type="password"
                name="password"
                value={formik.values.password}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                isInvalid={isPasswordInvalid}
                disabled={loading}
                className="pe-5"
              />
              {isPasswordInvalid && (
                <div className="position-absolute end-0 top-50 translate-middle-y me-3 text-danger">
                  !
                </div>
              )}
              <Form.Control.Feedback type="invalid">
                {formik.errors.password}
              </Form.Control.Feedback>
            </Form.Group>

            <Button variant="primary" type="submit" className="w-100" disabled={loading}>
              Войти
            </Button>
          </Form>

          <p className="text-center mt-3">
            {t('login.noAccount')} <Link to="/signup">{t('login.signupLink')}</Link>
          </p>
        </Col>
      </Row>
    </Container>
  );
};

export default LoginPage;
