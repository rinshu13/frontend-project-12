import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Inline resources (ru только)
const resources = {
  ru: {
    translation: {
      // Header
      'header.title': 'Hexlet Chat',
      'header.logout': 'Выйти',

      // Login
      'login.title': 'Авторизация',
      'login.usernameLabel': 'Имя пользователя',
      'login.passwordLabel': 'Пароль',
      'login.submit': 'Войти',
      'login.loading': 'Вход...',
      'login.noAccount': 'Нет аккаунта?',
      'login.signupLink': 'Регистрация',
      'errors.required': 'Обязательно',
      'errors.min3': 'От 3 до 20 символов',
      'errors.min6': 'Не менее 6 символов',
      'errors.unauthorized': 'Неверные имя пользователя или пароль',

      // Signup
      'signup.title': 'Регистрация',
      'signup.usernameLabel': 'Имя пользователя',
      'signup.passwordLabel': 'Пароль',
      'signup.confirmPasswordLabel': 'Подтвердите пароль',
      'signup.submit': 'Зарегистрироваться',
      'signup.loginLink': 'Войти',
      'errors.max20': 'От 3 до 20 символов',
      'errors.passwordMismatch': 'Пароли должны совпадать',
      'errors.conflict': 'Пользователь с таким именем уже существует',
      'errors.signup': 'Ошибка регистрации. Попробуйте позже.',

      // App/Chat
      'app.channelsTitle': 'Каналы',
      'app.addChannel': '+',
      'app.logout': 'Выйти',
      'app.noMessages': 'Нет сообщений',
      'app.messagePlaceholder': 'Введите сообщение...',
      'app.send': 'Отправить',
      'app.sendError': 'Ошибка отправки. Повторите попытку.',
      'app.retryError': 'Повторная отправка не удалась.',
      'app.channelPrefix': '# ',
      'app.fallbackChannels': 'Загружены дефолтные каналы (general, random)',
      'app.demoMessages': 'Добавлены демо-сообщения для канала',

      // Validation для сообщений
      'validation.messageRequired': 'Сообщение обязательно',
      'validation.messageTooLong': 'Сообщение слишком длинное (max 500)',
      'validation.profanityDetected': 'Обнаружен мат — текст очищен',

      // Modals
      'modal.addTitle': 'Добавить канал',
      'modal.addNameLabel': 'Имя канала',
      'modal.addCancel': 'Отменить',
      'modal.addSubmit': 'Добавить',
      'modal.addLoading': 'Создание...',
      'modal.addErrorMin': 'Имя не короче 3 символов',
      'modal.addErrorMax': 'Имя не длиннее 20 символов',
      'modal.addErrorRequired': 'Имя канала обязательно',
      'modal.addErrorUnique': 'Имя канала уже существует',
      'modal.addError': 'Ошибка создания канала',
      'modal.addErrorProfanity': 'Нецензурное слово в имени канала',

      'modal.renameTitle': 'Переименовать канал',
      'modal.renameNameLabel': 'Имя канала',
      'modal.renameCancel': 'Отменить',
      'modal.renameSubmit': 'Сохранить',
      'modal.renameLoading': 'Сохранение...',
      'modal.renameErrorUnique': 'Имя канала уже существует',
      'modal.renameError': 'Ошибка переименования',
      'modal.renameErrorProfanity': 'Нецензурное слово в имени канала',

      'modal.removeTitle': 'Удалить канал?',
      'modal.removeBody': 'Подтвердите удаление канала. Это действие нельзя отменить.',
      'modal.removeCancel': 'Отменить',
      'modal.removeSubmit': 'Удалить',
      'modal.removeLoading': 'Удаление...',

      // NotFound
      'notfound.title': '404 - Page Not Found',
      'notfound.message': 'К сожалению, такой страницы нет.',
      'notfound.back': 'Вернуться на главную',

      // Dropdown
      'dropdown.rename': 'Переименовать',
      'dropdown.remove': 'Удалить',

      // Toast
      'toast.success.createChannel': 'Канал создан',
      'toast.success.renameChannel': 'Канал переименован',
      'toast.success.deleteChannel': 'Канал удалён',
      'toast.success.login': 'Вход успешен!',
      'toast.error.fetchChannels': 'Ошибка загрузки каналов',
      'toast.error.fetchMessages': 'Ошибка загрузки сообщений',
      'toast.error.network': 'Ошибка соединения',
      'toast.error.generic': 'Произошла ошибка',
      'toast.error.login': 'Ошибка входа',
      'toast.warning.profanity': 'Нецензурное слово заменено',
      'toast.info.logout': 'Вы вышли из аккаунта',
    },
  },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'ru',
    fallbackLng: 'ru',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
