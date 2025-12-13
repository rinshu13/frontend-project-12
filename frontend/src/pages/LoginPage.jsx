import React, { useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { login } from '../features/auth/authSlice';
import api from '../api';
import { Form, Button, Container, Row, Col } from 'react-bootstrap';
import { Formik, Field, Form, ErrorMessage } from 'formik';

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
    <Container className="h-100">
      <Row className="justify-content-center align-content-center h-100">
        <Col xs={12} md={8} xxl={6}>
          <h1 className="text-center mb-4">Войти</h1>

          {/* Замените <Form> из react-bootstrap на <Form> из formik */}
          <Formik
            initialValues={{ username: '', password: '' }}
            validationSchema={LoginSchema}
            onSubmit={async (values) => {
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
            }}
          >
            <Form className="p-3">  {/* <-- Это Form из formik, он сам делает preventDefault */}
              <Form.Group className="mb-3 position-relative">
                <Field
                  type="text"
                  name="username"
                  placeholder="Ваш ник"
                  className={`form-control pe-5 rounded ${isUsernameInvalid ? 'is-invalid' : ''}`}
                  disabled={loading}
                />
                {isUsernameInvalid && (
                  <div className="position-absolute end-0 top-50 translate-middle-y me-3 text-danger fw-bold fs-4">
                    !
                  </div>
                )}
              </Form.Group>

              <Form.Group className="mb-4 position-relative">
                <Field
                  type="password"
                  name="password"
                  placeholder="Пароль"
                  className={`form-control pe-5 rounded ${isPasswordInvalid ? 'is-invalid' : ''}`}
                  disabled={loading}
                />
                {isPasswordInvalid && (
                  <div className="position-absolute end-0 top-50 translate-middle-y me-3 text-danger fw-bold fs-4">
                    !
                  </div>
                )}
              </Form.Group>

              {authError && (
                <div className="alert alert-danger text-center mb-4 py-3">
                  {authError}
                </div>
              )}

              <Button variant="primary" type="submit" className="w-100 rounded-pill py-2" disabled={loading}>
                Войти
              </Button>
            </Form>
          </Formik>

          <div className="text-center mt-4">
            Нет аккаунта? <Link to="/signup">Регистрация</Link>
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default LoginPage;