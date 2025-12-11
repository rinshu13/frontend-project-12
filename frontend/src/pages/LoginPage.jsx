import React from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';

const LoginSchema = Yup.object().shape({
  username: Yup.string()
    .min(3, 'Имя должно быть не короче 3 символов')
    .required('Имя пользователя обязательно'),
  password: Yup.string()
    .min(6, 'Пароль должен быть не короче 6 символов')
    .required('Пароль обязателен'),
});

const LoginPage = () => (
  <div className="login-page">
    <h1>Авторизация</h1>
    <Formik
      initialValues={{
        username: '',
        password: '',
      }}
      validationSchema={LoginSchema}
      onSubmit={(values) => {
        console.log('Submit:', values);  // Пока только лог, позже API
        // Здесь будет fetch('/api/v1/signup' или /login)
      }}
    >
      {({ isSubmitting }) => (
        <Form className="login-form">
          <div className="field">
            <label htmlFor="username">Имя пользователя:</label>
            <Field name="username" type="text" />
            <ErrorMessage name="username" component="div" className="error" />
          </div>
          <div className="field">
            <label htmlFor="password">Пароль:</label>
            <Field name="password" type="password" />
            <ErrorMessage name="password" component="div" className="error" />
          </div>
          <button type="submit" disabled={isSubmitting}>
            Войти
          </button>
        </Form>
      )}
    </Formik>
  </div>
);

export default LoginPage;
