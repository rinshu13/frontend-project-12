// src/pages/NotFoundPage.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './AuthPages.css';

const NotFoundPage = () => {
  const { t } = useTranslation();

  return (
    <div className="auth-container not-found">
      <div>
        <h1>{t('notfound.title')}</h1>
        <p>{t('notfound.message')}</p>
        <Link to="/" className="link">{t('notfound.back')}</Link>
      </div>
    </div>
  );
};

export default NotFoundPage;