// src/pages/SignupPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';  // ИЗМЕНЕНО: Добавлен для ссылки на login
import { login } from '../features/auth/authSlice';
import api from '../api';
import { Container, Row, Col, Form, Button, Alert, FloatingLabel } from 'react-bootstrap';

const SignupPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const form = e.target;
    const username = form.username.value.trim();
    const password = form.password.value;
    const confirmPassword = form.confirmPassword.value;

    if (username.length < 3 || username.length > 20) {
      setError(t('errors.min3'));
      return;
    }
    if (password.length < 6) {
      setError(t('errors.min6'));
      return;
    }
    if (password !== confirmPassword) {
      setError(t('errors.passwordMismatch'));
      return;
    }

    try {
      const response = await api.post('/signup', { username, password });
      const { token } = response.data;

      if (!token || typeof token !== 'string') {
        throw new Error('Invalid token in response');
      }

      dispatch(login({ token, username }));
      window.location.href = '/';
    } catch (err) {
      if (err.response?.status === 409) {
        setError(t('errors.conflict'));
      } else {
        setError(t('errors.signup'));
      }
    }
  };

  return (
    <Container className="signup-page">
      <Row className="justify-content-md-center mt-5">
        <Col md={6} lg={5}>
          <h1 className="text-center mb-4">{t('signup.title')}</h1>

          {error && <Alert variant="danger" className="mb-4">{error}</Alert>}

          <Form onSubmit={handleSubmit} noValidate>
            <FloatingLabel
              controlId="username"
              label={t('signup.usernameLabel')}
              className="mb-3"
            >
              <Form.Control
                type="text"
                name="username"
                placeholder={t('signup.usernameLabel')}
                required
                autoFocus
              />
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
                required
              />
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
                required
              />
            </FloatingLabel>

            <Button variant="primary" type="submit" size="lg" className="w-100">
              {t('signup.submit')}
            </Button>
          </Form>
          {/* ИЗМЕНЕНО: Добавлена ссылка на login */}
          <p className="text-center mt-3">
            {t('signup.loginLink')} <Link to="/login">{t('login.title')}</Link>
          </p>
        </Col>
      </Row>
    </Container>
  );
};

export default SignupPage;
