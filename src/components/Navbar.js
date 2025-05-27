import { useAuth } from '../AuthContext';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

function Navbar() {
  const { user, logout } = useAuth();
  const { t, i18n } = useTranslation();
  
  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  const isLoggedIn = !!user;
  const isAdmin = Number(user?.is_admin) === 1;

  return (
    <nav style={{ padding: '1rem', background: '#f0f0f0', display: 'flex', gap: '1rem' }}>
      <div style={{ display: 'flex', gap: '1rem' }}>
        <Link to="/news">{t('navbar.news')}</Link>
        <Link to="/places">{t('navbar.places')}</Link>
        {isLoggedIn && <Link to="/profile">{t('navbar.profile')}</Link>}
        {isAdmin && <Link to="/admin">{t('navbar.admin')}</Link>}
      </div>

      <div style={{ marginLeft: 'auto', display: 'flex', gap: '1rem' }}>
        <button onClick={() => changeLanguage('ru')}>RU</button>
        <button onClick={() => changeLanguage('en')}>EN</button>
        
        {isLoggedIn ? (
          <button onClick={logout}>{t('navbar.logout')}</button>
        ) : (
          <>
            <Link to="/login">{t('navbar.login')}</Link>
            <Link to="/register">{t('navbar.register')}</Link>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;