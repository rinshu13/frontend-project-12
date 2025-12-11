import React, { useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { login } from '../features/auth/authSlice';
import api from '../api'; // ✅ Используем настроенный api вместо axios
import { Form, Button, Alert, Container, Row, Col } from 'react-bootstrap';

const SignupPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [error, setError] = useState(null);

  const SignupSchema = Yup.object().shape({
    username: Yup.string()
      .min(3, t('errors.min3'))
      .max(20, t('errors.max20'))
      .required(t('errors.required')),
    password: Yup.string()
      .min(6, t('errors.min6'))
      .required(t('errors.required')),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref('password'), null], t('errors.passwordMismatch'))
      .required(t('errors.required')),
  });

  const formik = useFormik({
    initialValues: {
      username: '',
      password: '',
      confirmPassword: '',
    },
    validationSchema: SignupSchema,
    onSubmit: async (values) => {
      setError(null);
      try {
        // ✅ Правильный путь — /signup (baseURL уже /api/v1)
        const response = await api.post('/signup', {
          username: values.username,
          password: values.password,
        });

        const { token, username } = response.data;

        // ✅ Защита: если сервер вернул некорректный ответ
        if (!token || !username) {
          throw new Error('Invalid server response: missing token or username');
        }

        dispatch(login({ token, username }));
        navigate('/');
      } catch (error) {
        console.error('Signup error:', error);
        if (error.response?.status === 409) {
          setError(t('errors.conflict'));
        } else {
          setError(t('errors.signup'));
        }
      }
    },
  });

  return (
    <Container className="signup-page">
      <Row className="justify-content-md-center">
        <Col md={6}>
          <h1 className="text-center mb-4">{t('signup.title')}</h1>
          {error && <Alert variant="danger" className="mb-3">{error}</Alert>}
          <Form onSubmit={formik.handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>{t('signup.usernameLabel')}</Form.Label>
              <Form.Control
                type="text"
                name="username"
                value={formik.values.username}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                isInvalid={formik.touched.username && !!formik.errors.username}
              />
              <Form.Control.Feedback type="invalid">
                {formik.errors.username}
              </Form.Control.Feedback>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>{t('signup.passwordLabel')}</Form.Label>
              <Form.Control
                type="password"
                name="password"
                value={formik.values.password}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                isInvalid={formik.touched.password && !!formik.errors.password}
              />
              <Form.Control.Feedback type="invalid">
                {formik.errors.password}
              </Form.Control.Feedback>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>{t('signup.confirmPasswordLabel')}</Form.Label>
              <Form.Control
                type="password"
                name="confirmPassword"
                value={formik.values.confirmPassword}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                isInvalid={formik.touched.confirmPassword && !!formik.errors.confirmPassword}
              />
              <Form.Control.Feedback type="invalid">
                {formik.errors.confirmPassword}
              </Form.Control.Feedback>
            </Form.Group>
            <Button variant="primary" type="submit" className="w-100 mb-3">
              {t('signup.submit')}
            </Button>
            <div className="text-center">
              <a href="/login">{t('signup.loginLink')}</a>
            </div>
          </Form>
        </Col>
      </Row>
    </Container>
  );
};

export default SignupPage;
