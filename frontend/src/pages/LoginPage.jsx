import React from 'react';
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
    onSubmit: async (values, { setSubmitting }) => {
      try {
        const response = await api.post('/api/v1/login', values);

        const { token, username } = response.data;

        if (!token || typeof token !== 'string') {
          throw new Error('Invalid token in response');
        }

        // Успешный вход — сохраняем токен и username (аналогично SignupPage)
        dispatch(login({ token, username }));
        navigate('/');
      } catch (err) {
        setSubmitting(false); // Важно: не сбрасываем форму при ошибке
        console.error('Login error:', err);

        // При любой ошибке (неверные данные, сеть и т.д.) выводим требуемое сообщение
        formik.setErrors({ username: 'Неверные имя пользователя или пароль' });
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
            noValidate
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
                onBlur={formik.handleBlur}
                isInvalid={!!formik.errors.username && formik.touched.username}
                autoFocus
              />
              <Form.Control.Feedback type="invalid">
                {formik.errors.username}
              </Form.Control.Feedback>
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
                onBlur={formik.handleBlur}
                isInvalid={!!formik.errors.password && formik.touched.password}
              />
              <Form.Control.Feedback type="invalid">
                {formik.errors.password}
              </Form.Control.Feedback>
            </FloatingLabel>

            <Button
              variant="primary"
              type="submit"
              className="w-100 rounded-pill py-2"
              disabled={formik.isSubmitting}
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