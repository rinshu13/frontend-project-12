import React, { useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { login } from '../features/auth/authSlice';
import api from '../api';  // ИЗМЕНЕНО: Используем api вместо axios
import { Form, Button, Alert, Container, Row, Col } from 'react-bootstrap';

const LoginPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);  // ИЗМЕНЕНО: Добавлен loading

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
      setLoading(true);  // ИЗМЕНЕНО: Loading on
      try {
        const response = await api.post('/login', values);  // ИЗМЕНЕНО: api.post('/login')
        const { token, username } = response.data;  // Предполагаем { token, username } в data
        dispatch(login({ token, username }));
        navigate('/');
      } catch (error) {
        setError(error.response?.data?.message || t('errors.unauthorized'));
      } finally {
        setLoading(false);  // ИЗМЕНЕНО: Loading off
      }
    },
  });

  return (
    <Container className="login-page">
      <Row className="justify-content-md-center">
        <Col md={6}>
          <h1 className="text-center mb-4">{t('login.title')}</h1>
          {error && <Alert variant="danger" className="mb-3">{error}</Alert>}
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
                disabled={loading}  // ИЗМЕНЕНО: Disabled on loading
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
                disabled={loading}  // ИЗМЕНЕНО: Disabled on loading
              />
              <Form.Control.Feedback type="invalid">
                {formik.errors.password}
              </Form.Control.Feedback>
            </Form.Group>
            <Button variant="primary" type="submit" className="w-100" disabled={loading}>
              {loading ? t('login.loading') : t('login.submit')}  // ИЗМЕНЕНО: Loading text
            </Button>
          </Form>
          <p className="text-center mt-3">
            {t('login.noAccount')} <Link to="/signup">{t('login.signupLink')}</Link>  // ИЗМЕНЕНО: Перевод
          </p>
        </Col>
      </Row>
    </Container>
  );
};

export default LoginPage;
