import { useState } from 'react';
import { useAuth } from '../AuthContext';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import '../styles/Login.css'; // Создай этот файл
function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const { login } = useAuth(); // используем login из контекста
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (res.ok) {
        login(data.user); // сохраняем пользователя в контекст и localStorage
        navigate('/news'); // или куда нужно перенаправить
        setMessage(`Добро пожаловать, ${data.user.username}`);
      } else {
        setMessage(data.message || 'Ошибка входа');
      }
    } catch (err) {
      console.error(err);
      setMessage('Ошибка подключения к серверу');
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2 className="login-title">Вход в систему</h2>
        <form onSubmit={handleLogin} className="login-form">
          <input
            type="text"
            placeholder="Логин"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="login-input"
          />
          <input
            type="password"
            placeholder="Пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="login-input"
          />
          <button type="submit" className="login-button">
            Войти
          </button>
        </form>
        <div className="login-footer">
          Нет аккаунта? <Link to="/register" className="login-link">Зарегистрироваться</Link>
        </div>
        {message && (
          <p className={`login-message ${message.includes('Добро пожаловать') ? 'success' : 'error'}`}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
}

export default Login;
