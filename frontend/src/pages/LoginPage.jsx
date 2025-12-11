import React, { useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { login } from '../features/auth/authSlice';  // Импорт action
import axios from 'axios';
import { Form, Button, Alert, Container, Row, Col } from 'react-bootstrap';

const LoginSchema = Yup.object().shape({
  username: Yup.string()
    .min(3, 'Имя должно быть не короче 3 символов')
    .required('Имя пользователя обязательно'),
  password: Yup.string()
    .min(6, 'Пароль должен быть не короче 6 символов')
    .required('Пароль обязателен'),
});

const LoginPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [error, setError] = useState(null);  // State для ошибки
  const formik = useFormik({
    initialValues: {
      username: '',
      password: '',
    },
    validationSchema: LoginSchema,
    onSubmit: async (values) => {
      setError(null);  // Очисти предыдущую ошибку
      try {
        const response = await axios.post('/api/v1/login', values);  // POST на сервер
        const { token, username } = response.data;
        dispatch(login({ token, username }));  // Сохрани в Redux и localStorage
        navigate('/');  // Редирект на главную
      } catch (error) {
        setError(error.response?.data?.message || 'Ошибка авторизации');  // Установка ошибки
      }
    },
  });

  return (
    <Container className="login-page">
      <Row className="justify-content-md-center">
        <Col md={6}>
          <h1 className="text-center mb-4">Авторизация</h1>
          {error && <Alert variant="danger" className="mb-3">{error}</Alert>}  {/* Показ ошибки */}
          <Form onSubmit={formik.handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Имя пользователя:</Form.Label>
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
              <Form.Label>Пароль:</Form.Label>
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
            <Button variant="primary" type="submit" className="w-100">
              Войти
            </Button>
          </Form>
        </Col>
      </Row>
    </Container>
  );
};

export default LoginPage;
