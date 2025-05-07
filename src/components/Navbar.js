import { useAuth } from '../AuthContext';
import { Link } from 'react-router-dom';

function Navbar() {
  const { user, logout } = useAuth();

  const isLoggedIn = !!user;
  const isAdmin = Number(user?.is_admin) === 1;

  return (
    <nav style={{ padding: '1rem', background: '#f0f0f0' }}>
      <Link to="/news">Новости</Link> | <Link to="/places">Места</Link> |{' '}
      {isLoggedIn ? (
        <>
          <Link to="/profile">Профиль</Link> |{' '}
          {isAdmin && <Link to="/admin">Админка</Link>} |{' '}
          <button onClick={logout}>Выйти</button>
        </>
      ) : (
        <>
          <Link to="/login">Вход</Link> | <Link to="/register">Регистрация</Link>
        </>
      )}
    </nav>
  );
}

export default Navbar;