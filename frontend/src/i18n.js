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
      'login.usernameLabel': 'Имя пользователя:',
      'login.passwordLabel': 'Пароль:',
      'login.submit': 'Войти',
      'login.signupLink': 'Нет аккаунта? Зарегистрируйтесь',
      'errors.required': 'Обязательно',
      'errors.min3': 'Не короче 3 символов',
      'errors.min6': 'Не короче 6 символов',
      'errors.unauthorized': 'Ошибка авторизации',

      // Signup
      'signup.title': 'Регистрация',
      'signup.usernameLabel': 'Имя пользователя:',
      'signup.passwordLabel': 'Пароль:',
      'signup.confirmPasswordLabel': 'Подтверждение пароля:',
      'signup.submit': 'Зарегистрироваться',
      'signup.loginLink': 'Уже есть аккаунт? Войти',
      'errors.max20': 'Не длиннее 20 символов',
      'errors.passwordMismatch': 'Пароли не совпадают',
      'errors.conflict': 'Пользователь с таким именем уже существует',
      'errors.signup': 'Ошибка регистрации. Попробуйте позже.',

      // App/Chat
      'app.channelsTitle': 'Каналы',
      'app.addChannel': '+ Добавить канал',
      'app.noMessages': 'Нет сообщений',
      'app.messagePlaceholder': 'Введите сообщение...',
      'app.send': 'Отправить',
      'app.sendError': 'Ошибка отправки. Повторите попытку.',
      'app.retryError': 'Повторная отправка не удалась.',
      'app.channelPrefix': '# ',

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

      'modal.renameTitle': 'Переименовать канал',
      'modal.renameNameLabel': 'Имя канала',
      'modal.renameCancel': 'Отменить',
      'modal.renameSubmit': 'Сохранить',
      'modal.renameLoading': 'Сохранение...',
      'modal.renameErrorUnique': 'Имя канала уже существует',
      'modal.renameError': 'Ошибка переименования',

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

      // Toast (новые ключи для Шага 9)
      'toast.success.createChannel': 'Канал создан',
      'toast.success.renameChannel': 'Канал переименован',
      'toast.success.deleteChannel': 'Канал удалён',
      'toast.error.fetchChannels': 'Ошибка загрузки каналов',
      'toast.error.fetchMessages': 'Ошибка загрузки сообщений',
      'toast.error.network': 'Сеть недоступна',
      'toast.error.generic': 'Произошла ошибка',
    },
  },
};

i18n
  .use(initReactI18next)  // React bindings
  .init({
    resources,
    lng: 'ru',  // Default locale
    fallbackLng: 'ru',
    interpolation: {
      escapeValue: false,  // React already escapes
    },
  });

export default i18n;
