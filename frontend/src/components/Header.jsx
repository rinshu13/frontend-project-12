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
    <header className="shadow-sm">
      <nav className="navbar navbar-expand navbar-light bg-white py-3">
        <div className="container-fluid">
          <Link to="/" className="navbar-brand fw-bold fs-4">
            {t('header.title')}
          </Link>

          {token && (
            <button
              type="button"
              className="btn btn-outline-danger"
              onClick={handleLogout}
            >
              {t('header.logout')}
            </button>
          )}
        </div>
      </nav>
    </header>
  );
};
