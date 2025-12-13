import React, { useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { login } from '../features/auth/authSlice';
import api from '../api';
import { Container, Row, Col, Form, Button, FloatingLabel } from 'react-bootstrap';

const LoginPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [authError, setAuthError] = useState(null);
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

    // Ручная валидация перед отправкой
    try {
      await LoginSchema.validate(values, { abortEarly: false });
    } catch (validationErr) {
      setAuthError('Неверные имя пользователя или пароль');
      setLoading(false);
      return; // Прерываем отправку на сервер
    }

    try {
      const response = await api.post('/api/v1/login', values);

      if (!response.data || !response.data.token || !response.data.username) {
        throw new Error('Invalid response from server');
      }

      const { token, username } = response.data;
      dispatch(login({ token, username }));
      navigate('/');
    } catch (err) {
      console.error('Login error:', err);
      setAuthError('Неверные имя пользователя или пароль');
    } finally {
      setLoading(false);
    }
  },
  });

  return (
    <Container className="h-100">
      <Row className="justify-content-center align-content-center h-100">
        <Col xs={12} md={8} xxl={6}>
          <h1 className="text-center mb-4">Войти</h1>

          <Form
            onSubmit={(e) => {
              e.preventDefault();
              formik.handleSubmit();
            }}
          >
            <FloatingLabel
              controlId="username"
              label="Ваш ник"
              className="mb-3"
            >
              <Form.Control
                type="text"
                name="username"
                placeholder="Ваш ник"
                value={formik.values.username}
                onChange={formik.handleChange}
                disabled={loading}
                autoFocus
                required
              />
            </FloatingLabel>

            <FloatingLabel
              controlId="password"
              label="Пароль"
              className="mb-4"
            >
              <Form.Control
                type="password"
                name="password"
                placeholder="Пароль"
                value={formik.values.password}
                onChange={formik.handleChange}
                disabled={loading}
                required
              />
            </FloatingLabel>

            {authError && (
              <div className="alert alert-danger text-center mb-4 py-3">
                {authError}
              </div>
            )}

            <Button
              variant="primary"
              type="submit"
              className="w-100 rounded-pill py-2"
              disabled={loading}
            >
              Войти
            </Button>
          </Form>

          <div className="text-center mt-4">
            Нет аккаунта? <Link to="/signup">Регистрация</Link>
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default LoginPage;