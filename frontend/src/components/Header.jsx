import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { logout } from '../store/auth/authSlice'

export const Header = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { token } = useSelector(state => state.auth)
  const { t } = useTranslation()

  const handleLogout = () => {
    dispatch(logout())
    navigate('/login')
  }

  return (
    <header className="app-header">
      <div className="header-container">
        <Link to="/" className="header-brand">
          {t('header.title')}
        </Link>

        {token && (
          <button
            type="button"
            className="header-logout-btn"
            onClick={handleLogout}
          >
            {t('header.logout')}
          </button>
        )}
      </div>
    </header>
  )
}
