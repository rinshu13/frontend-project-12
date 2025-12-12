import React, { useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { login } from '../features/auth/authSlice';
import api from '../api';
import { Form, Button, Alert, Container, Row, Col } from 'react-bootstrap';

const LoginPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [error, setError] = useState(null);
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
      setError(null);
      setLoading(true);
      try {
        const response = await api.post('/api/v1/login', values);
        const { token, username } = response.data;
        dispatch(login({ token, username }));
        navigate('/');
      } catch (err) {
        if (err.response?.status === 401) {
          // Точный текст без дополнительных элементов внутри Alert
          setError('Неверные имя пользователя или пароль');
        } else {
          setError(t('errors.network') || 'Ошибка сети. Попробуйте позже.');
        }
      } finally {
        setLoading(false);
      }
    },
  });

  return (
    <Container className="login-page">
      <Row className="justify-content-md-center">
        <Col md={6}>
          <h1 className="text-center mb-4">{t('login.title')}</h1>
          {error && (
            <Alert variant="danger" className="mb-3">
              {error}
            </Alert>
          )}
          <Form onSubmit={formik.handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>{t('login.usernameLabel')}</Form.Label>
              <Form.Control
                type="text"
                name="username"
                value={formik.values.username}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                isInvalid={formik.touched.username && !!formik.errors.username}
                disabled={loading}
              />
              <Form.Control.Feedback type="invalid">
                {formik.errors.username}
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>{t('login.passwordLabel')}</Form.Label>
              <Form.Control
                type="password"
                name="password"
                value={formik.values.password}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                isInvalid={formik.touched.password && !!formik.errors.password}
                disabled={loading}
              />
              <Form.Control.Feedback type="invalid">
                {formik.errors.password}
              </Form.Control.Feedback>
            </Form.Group>

            <Button variant="primary" type="submit" className="w-100" disabled={loading}>
              {loading ? t('login.loading') : t('login.submit')}
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
