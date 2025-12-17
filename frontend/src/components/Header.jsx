import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { logout } from '../features/auth/authSlice';

export const Header = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { token } = useSelector((state) => state.auth);
  const { t } = useTranslation();

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <header className="app-header shadow-sm bg-white border-bottom">
      <div className="header-container container-fluid px-4 d-flex justify-content-between align-items-center py-3">
        <Link to="/" className="header-brand navbar-brand fw-bold fs-4 text-primary">
          {t('header.title')}
        </Link>

        {token && (
          <button
            type="button"
            className="header-logout-btn btn btn-outline-danger"
            onClick={handleLogout}
          >
            {t('header.logout')}
          </button>
        )}
      </div>
    </header>
  );
};