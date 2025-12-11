import React, { useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { login } from '../features/auth/authSlice';
import axios from 'axios';
import { Form, Button, Alert, Container, Row, Col } from 'react-bootstrap';

const SignupSchema = Yup.object().shape({
  username: Yup.string()
    .min(3, 'Имя должно быть не короче 3 символов')
    .max(20, 'Имя должно быть не длиннее 20 символов')
    .required('Имя пользователя обязательно'),
  password: Yup.string()
    .min(6, 'Пароль должен быть не короче 6 символов')
    .required('Пароль обязателен'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password'), null], 'Пароли не совпадают')
    .required('Подтверждение пароля обязательно'),
});

const SignupPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [error, setError] = useState(null);

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
        // POST /signup
        const response = await axios.post('/api/v1/signup', {
          username: values.username,
          password: values.password,
        });
        const { token, username } = response.data;
        dispatch(login({ token, username }));  // Авто-логин
        navigate('/');  // Редирект на чат
      } catch (error) {
        if (error.response?.status === 409) {
          setError('Пользователь с таким именем уже существует');
        } else {
          setError('Ошибка регистрации. Попробуйте позже.');
        }
      }
    },
  });

  return (
    <Container className="signup-page">
      <Row className="justify-content-md-center">
        <Col md={6}>
          <h1 className="text-center mb-4">Регистрация</h1>
          {error && <Alert variant="danger" className="mb-3">{error}</Alert>}
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
            <Form.Group className="mb-3">
              <Form.Label>Подтверждение пароля:</Form.Label>
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
              Зарегистрироваться
            </Button>
          </Form>
          <p className="text-center">
            Уже есть аккаунт? <Link to="/login">Войти</Link>
          </p>
        </Col>
      </Row>
    </Container>
  );
};

export default SignupPage;
