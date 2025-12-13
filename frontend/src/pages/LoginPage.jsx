import React, { useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { login } from '../features/auth/authSlice';
import { loginUser } from '../api'; // Убедись, что импорт есть
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

      try {
        const response = await loginUser(values);

        // Стандартный ответ Hexlet Chat: { token: "...", username: "..." }
        const { token, username } = response.data;

        if (!token || !username) {
          throw new Error('Invalid response data');
        }

        dispatch(login({ token, username }));
        localStorage.setItem('token', token);
        localStorage.setItem('username', username);

        navigate('/');
      } catch (err) {
        console.error('Login error:', err);

        // Правильная обработка 401 от сервера
        if (err.response?.status === 401) {
          setAuthError('Неверные имя пользователя или пароль');
        } else {
          setAuthError('Ошибка сети или сервера. Попробуйте позже.');
        }
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

          <Form onSubmit={formik.handleSubmit} noValidate>
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
                onBlur={formik.handleBlur}
                disabled={loading}
                isInvalid={formik.touched.username && formik.errors.username}
                autoFocus
                required
              />
              {formik.touched.username && formik.errors.username && (
                <Form.Control.Feedback type="invalid">
                  {formik.errors.username}
                </Form.Control.Feedback>
              )}
            </FloatingLabel>

            <FloatingLabel
              controlId="password"
              label="Пароль"
              className="mb-3"
            >
              <Form.Control
                type="password"
                name="password"
                placeholder="Пароль"
                value={formik.values.password}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                disabled={loading}
                isInvalid={formik.touched.password && formik.errors.password}
                required
              />
              {formik.touched.password && formik.errors.password && (
                <Form.Control.Feedback type="invalid">
                  {formik.errors.password}
                </Form.Control.Feedback>
              )}
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
              disabled={loading || !formik.isValid || !formik.dirty}
            >
              {loading ? 'Вход...' : 'Войти'}
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
