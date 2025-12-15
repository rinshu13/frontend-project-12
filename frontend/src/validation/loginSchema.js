import * as Yup from 'yup'

const loginSchema = (t) =>
  Yup.object().shape({
    username: Yup.string()
      .min(3, t('errors.min3'))
      .required(t('errors.required')),
    password: Yup.string()
      .required(t('errors.required')),
  });

export default loginSchema
