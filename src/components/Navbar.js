// src/components/Navbar.js
import { Link } from 'react-router-dom';

function Navbar({ isAdmin, isLoggedIn, onLogout }) {
  return (
    <nav style={{ padding: '1rem', background: '#f0f0f0' }}>
      <Link to="/news">Новости</Link> |{' '}
      <Link to="/places">Места</Link> |{' '}
      {isLoggedIn && <Link to="/profile">Личный кабинет</Link>} |{' '}
      {isAdmin && <Link to="/admin">Админ-панель</Link>} |{' '}
      {!isLoggedIn ? (
        <>
          <Link to="/login">Вход</Link> | <Link to="/register">Регистрация</Link>
        </>
      ) : (
        <button onClick={onLogout}>Выйти</button>
      )}
    </nav>
  );
}

export default Navbar;
