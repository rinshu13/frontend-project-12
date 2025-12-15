import * as Yup from 'yup'

const addChannelSchema = Yup.object().shape({
  name: Yup.string()
    .trim()
    .min(3, 'От 3 до 20 символов')
    .max(20, 'От 3 до 20 символов')
    .required('Имя канала обязательно'),
});

export default addChannelSchema
