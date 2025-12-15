import * as Yup from 'yup'

const signupSchema = Yup.object().shape({
  username: Yup.string()
    .min(3, 'errors.min3')
    .max(20, 'errors.max20')
    .required('errors.required'),
  password: Yup.string()
    .min(6, 'errors.min6')
    .required('errors.required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password')], 'errors.passwordMismatch')
    .required('errors.required'),
});

export default signupSchema
