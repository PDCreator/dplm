import { useState } from 'react';
import { useAuth } from '../AuthContext';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import '../styles/Register.css';

function Register() {
  const { t } = useTranslation( 'loginRegister');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();

    if (!/^[a-zA-Z0-9]+$/.test(username)) {
      return setMessage(t('register.username_requirements'));
    }
    if (password.length < 8) {
      return setMessage(t('register.password_length'));
    }
    if (password.trim() !== confirmPassword.trim()) {
      return setMessage(t('register.password_mismatch'));
    }

    try {
      const res = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        return setMessage(data.message || t('register.error'));
      }

      const loginRes = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const loginData = await loginRes.json();

      if (loginRes.ok && loginData.user) {
        login(loginData.user);
        setMessage(t('register.welcome_message', { username: loginData.user.username }));
        setUsername('');
        setPassword('');
        setConfirmPassword('');
        navigate('/news');
      } else {
        setMessage(t('register.login_after_error'));
      }
    } catch (err) {
      setMessage(t('register.connection_error'));
      console.error(err);
    }
  };

  return (
    <div className="register-container">
      <div className="register-card">
        <h2 className="register-title">{t('register.title')}</h2>
        <form onSubmit={handleRegister} className="register-form">
          <input
            type="text"
            placeholder={t('register.username_placeholder')}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="register-input"
            required
          />
          <input
            type="password"
            placeholder={t('register.password_placeholder')}
            value={password}
            autoComplete="off"
            onChange={(e) => setPassword(e.target.value)}
            className="register-input"
            required
          />
          <input
            type="password"
            placeholder={t('register.confirm_password_placeholder')}
            value={confirmPassword}
            autoComplete="off"
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="register-input"
            required
          />
          <button type="submit" className="register-button">
            {t('register.submit_button')}
          </button>
        </form>
        {message && (
          <p className={`register-message ${message.includes(t('register.welcome_message').split('{')[0]) ? 'success' : 'error'}`}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
}

export default Register;