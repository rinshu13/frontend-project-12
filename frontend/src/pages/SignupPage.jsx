// src/pages/SignupPage.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { login } from '../features/auth/authSlice';
import api from '../api';
import { Container, Row, Col, Form, Button, Alert, FloatingLabel } from 'react-bootstrap';

const SignupPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { t } = useTranslation();

  const SignupSchema = Yup.object().shape({
    username: Yup.string()
      .min(3, 'errors.min3')
      .max(20, 'errors.max20')
      .required('errors.required'),
    password: Yup.string()
      .min(6, 'errors.min6')  // ← Ключ для ошибки "Не менее 6 символов"
      .required('errors.required'),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref('password')], 'errors.passwordMismatch')
      .required('errors.required'),
  });

  const formik = useFormik({
    initialValues: {
      username: '',
      password: '',
      confirmPassword: '',
    },
    validationSchema: SignupSchema,
    onSubmit: async (values, { setSubmitting, setErrors }) => {
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
    },
  });

  return (
    <Container className="signup-page">
      <Row className="justify-content-md-center mt-5">
        <Col md={6} lg={5}>
          <h1 className="text-center mb-4">{t('signup.title')}</h1>

          <Form onSubmit={formik.handleSubmit} noValidate>
            <FloatingLabel
              controlId="username"
              label={t('signup.usernameLabel')}
              className="mb-3"
            >
              <Form.Control
                type="text"
                name="username"
                placeholder={t('signup.usernameLabel')}
                value={formik.values.username}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                isInvalid={formik.touched.username && !!formik.errors.username}
                required
                autoFocus
              />
              <Form.Control.Feedback type="invalid">
                {formik.errors.username && t(formik.errors.username)}
              </Form.Control.Feedback>
            </FloatingLabel>

            <FloatingLabel
              controlId="password"
              label={t('signup.passwordLabel')}
              className="mb-3"
            >
              <Form.Control
                type="password"
                name="password"
                placeholder={t('signup.passwordLabel')}
                value={formik.values.password}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                isInvalid={formik.touched.password && !!formik.errors.password}
                required
              />
              <Form.Control.Feedback type="invalid">
                {formik.errors.password && t(formik.errors.password)}
              </Form.Control.Feedback>
            </FloatingLabel>

            <FloatingLabel
              controlId="confirmPassword"
              label={t('signup.confirmPasswordLabel')}
              className="mb-4"
            >
              <Form.Control
                type="password"
                name="confirmPassword"
                placeholder={t('signup.confirmPasswordLabel')}
                value={formik.values.confirmPassword}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                isInvalid={formik.touched.confirmPassword && !!formik.errors.confirmPassword}
                required
              />
              <Form.Control.Feedback type="invalid">
                {formik.errors.confirmPassword && t(formik.errors.confirmPassword)}
              </Form.Control.Feedback>
            </FloatingLabel>

            <Button
              variant="primary"
              type="submit"
              size="lg"
              className="w-100"
              disabled={formik.isSubmitting}
            >
              {t('signup.submit')}
            </Button>
          </Form>

          <p className="text-center mt-3">
            {t('signup.loginLink')} <Link to="/login">{t('login.title')}</Link>
          </p>
        </Col>
      </Row>
    </Container>
  );
};

export default SignupPage;
