import { useState } from 'react';
import { useAuth } from '../AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import '../styles/Login.css';

function Login() {
  const { t } = useTranslation( 'loginRegister');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const { login } = useAuth();
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
        login(data.user);
        navigate('/news');
        setMessage(t('login.welcome_message', { username: data.user.username }));
      } else {
        setMessage(data.message || t('login.error'));
      }
    } catch (err) {
      console.error(err);
      setMessage(t('login.connection_error'));
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2 className="login-title">{t('login.title')}</h2>
        <form onSubmit={handleLogin} className="login-form">
          <input
            type="text"
            placeholder={t('login.username_placeholder')}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="login-input"
            required
          />
          <input
            type="password"
            placeholder={t('login.password_placeholder')}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="login-input"
            required
          />
          <button type="submit" className="login-button">
            {t('login.submit_button')}
          </button>
        </form>
        <div className="login-footer">
          {t('login.no_account')}{' '}
          <Link to="/register" className="login-link">
            {t('login.register_link')}
          </Link>
        </div>
        {message && (
          <p className={`login-message ${message.includes(t('login.welcome_message').split('{')[0]) ? 'success' : 'error'}`}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
}

export default Login;