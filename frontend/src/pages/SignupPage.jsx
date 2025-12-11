// src/pages/SignupPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { login } from '../features/auth/authSlice';
import api from '../api';
import { Container, Row, Col, Form, Button, Alert } from 'react-bootstrap';

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

    // Валидация по требованиям проекта
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

      // username берём из формы — бэкенд его НЕ возвращает
      dispatch(login({ token, username }));
      // Используем полную перезагрузку, чтобы гарантировать инициализацию состояния
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
      <Row className="justify-content-md-center">
        <Col md={6}>
          <h1 className="text-center mb-4">{t('signup.title')}</h1>
          {error && <Alert variant="danger" className="mb-3">{error}</Alert>}
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>{t('signup.usernameLabel')}</Form.Label>
              <Form.Control type="text" name="username" required />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>{t('signup.passwordLabel')}</Form.Label>
              <Form.Control type="password" name="password" required />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>{t('signup.confirmPasswordLabel')}</Form.Label>
              <Form.Control type="password" name="confirmPassword" required />
            </Form.Group>
            <Button variant="primary" type="submit" className="w-100 mb-3">
              {t('signup.submit')}
            </Button>
          </Form>
          <div className="text-center">
            <a href="/login">{t('signup.loginLink')}</a>
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default SignupPage;
