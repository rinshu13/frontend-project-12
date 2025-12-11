import React from 'react';
import { Link } from 'react-router-dom';
import { Container } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';

const NotFoundPage = () => {
  const { t } = useTranslation();

  return (
    <Container className="not-found">
      <h1>{t('notfound.title')}</h1>
      <p>{t('notfound.message')}</p>
      <Link to="/">{t('notfound.back')}</Link>
    </Container>
  );
};

export default NotFoundPage;
