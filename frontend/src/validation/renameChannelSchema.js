import * as Yup from 'yup'

const renameChannelSchema = t =>
  Yup.object().shape({
    name: Yup.string()
      .trim()
      .min(3, t('modal.channelNameLength'))
      .max(20, t('modal.channelNameLength'))
      .required(t('modal.channelNameRequired')),
  })

export default renameChannelSchema
