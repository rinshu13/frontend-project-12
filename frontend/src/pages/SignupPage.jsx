import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { login } from '../features/auth/authSlice';
import api from '../api';
import { Container, Row, Col, Form, Button, Alert } from 'react-bootstrap';

const SignupPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const { username, password, confirmPassword } = formData;

    if (!username || username.length < 3 || username.length > 20) {
      setError(t('errors.min3'));
      return;
    }
    if (!password || password.length < 6) {
      setError(t('errors.min6'));
      return;
    }
    if (password !== confirmPassword) {
      setError(t('errors.passwordMismatch'));
      return;
    }

    try {
      // Отправляем только username и password
      const response = await api.post('/signup', { username, password });
      const { token } = response.data; // ← только token возвращается!

      if (!token) {
        throw new Error('No token in response');
      }

      // username берём из формы, а не из ответа!
      dispatch(login({ token, username }));
      navigate('/');
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
              <Form.Control
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>{t('signup.passwordLabel')}</Form.Label>
              <Form.Control
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>{t('signup.confirmPasswordLabel')}</Form.Label>
              <Form.Control
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
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
