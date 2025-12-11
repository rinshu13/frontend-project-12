import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Provider } from 'react-redux';
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n';
import { store } from './store.js';
import { ErrorBoundary } from '@rollbar/react';  // Rollbar ErrorBoundary
import { Rollbar } from '@rollbar/react';  // Rollbar init
import { Header } from './components/Header.jsx';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import App from './App.jsx'
import LoginPage from './pages/LoginPage.jsx'
import SignupPage from './pages/SignupPage.jsx'
import NotFoundPage from './pages/NotFoundPage.jsx'
import './index.css'
import 'bootstrap/dist/css/bootstrap.min.css';

// Rollbar config из .env
const rollbarConfig = {
  accessToken: process.env.REACT_APP_ROLLBAR_TOKEN,  // Теперь из .env!
  environment: 'production',  // Для Render
  captureUncaught: true,  // Лови uncaught errors
  captureUnhandledRejections: true,  // Лови promise rejections
  // Replay сессий (опционально)
  replay: {
    enabled: true,
  },
  // Версия кода
  payload: {
    client: {
      javascript: {
        code_version: '1.0.0',  // Из package.json
      },
    },
  },
};

// Init Rollbar
const RollbarComponent = new Rollbar(rollbarConfig);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <I18nextProvider i18n={i18n}>
        <ErrorBoundary Rollbar={RollbarComponent}>  {/* Ловит ошибки */}
          <BrowserRouter>
            <Header />
            <Routes>
              <Route path="/" element={<App />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </BrowserRouter>
        </ErrorBoundary>
        <ToastContainer
          position="bottom-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="colored"
        />
      </I18nextProvider>
    </Provider>
  </React.StrictMode>,
)
