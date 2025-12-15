import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const NotFoundPage = () => {
  const { t } = useTranslation();

  return (
    <div className="d-flex align-items-center justify-content-center min-vh-100 bg-light">
      <div className="text-center p-5">
        <h1 className="display-1 fw-bold text-danger">404</h1>
        <p className="fs-3 mb-4">
          {t('notfound.title')}
        </p>
        <p className="lead mb-5 text-muted">
          {t('notfound.message')}
        </p>
        <Link to="/" className="btn btn-primary btn-lg">
          {t('notfound.back')}
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;
