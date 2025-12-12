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

  const hasAuthError = !!authError;
  const isUsernameInvalid = hasAuthError || (formik.touched.username && !!formik.errors.username);
  const isPasswordInvalid = hasAuthError || (formik.touched.password && !!formik.errors.password);

  return (
    <Container className="login-page h-100">
      <Row className="justify-content-center align-content-center h-100">
        <Col md={6} lg={4}>
          <h1 className="text-center mb-5">Войти</h1>

          <Form onSubmit={formik.handleSubmit}>
            <Form.Group className="mb-4">
              <Row className="align-items-center position-relative">
                <Col xs={4} className="text-end text-muted pe-0">
                  Ваш ник
                </Col>
                <Col xs={8}>
                  <Form.Control
                    type="text"
                    name="username"
                    value={formik.values.username}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    isInvalid={isUsernameInvalid}
                    disabled={loading}
                    className="rounded pe-5"
                  />
                  {isUsernameInvalid && (
                    <div className="position-absolute end-0 top-50 translate-middle-y me-3 text-danger fw-bold">
                      !
                    </div>
                  )}
                  <Form.Control.Feedback type="invalid">
                    {formik.errors.username}
                  </Form.Control.Feedback>
                </Col>
              </Row>
            </Form.Group>

            <Form.Group className="mb-4">
              <Row className="align-items-center position-relative">
                <Col xs={4} className="text-end text-muted pe-0">
                  Пароль
                </Col>
                <Col xs={8}>
                  <Form.Control
                    type="password"
                    name="password"
                    value={formik.values.password}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    isInvalid={isPasswordInvalid}
                    disabled={loading}
                    className="rounded pe-5"
                  />
                  {isPasswordInvalid && (
                    <div className="position-absolute end-0 top-50 translate-middle-y me-3 text-danger fw-bold">
                      !
                    </div>
                  )}
                  <Form.Control.Feedback type="invalid">
                    {formik.errors.password}
                  </Form.Control.Feedback>
                </Col>
              </Row>
            </Form.Group>

            {authError && (
              <div className="p-3 mb-3 text-white bg-danger rounded text-center">
                {authError}
              </div>
            )}

            <Button variant="primary" type="submit" className="w-100 rounded-pill py-2 mb-4" disabled={loading}>
              Войти
            </Button>
          </Form>

          <div className="text-center">
            Нет аккаунта? <Link to="/signup">Регистрация</Link>
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default LoginPage;
