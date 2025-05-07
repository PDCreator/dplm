import { useState } from 'react';
import { useAuth } from '../AuthContext';
import { useNavigate } from 'react-router-dom';
function Register() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();
  const handleRegister = async (e) => {
    e.preventDefault();

    if (!/^[a-zA-Z0-9]+$/.test(username)) {
      return setMessage('Логин должен содержать только латинские буквы и цифры');
    }
    if (password.length < 8) {
      return setMessage('Пароль должен быть минимум 8 символов');
    }
    if (password.trim() !== confirmPassword.trim()) {
      return setMessage('Пароли не совпадают');
    }

    try {
      const res = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        return setMessage(data.message || 'Ошибка регистрации');
      }

      // После успешной регистрации логиним пользователя
      const loginRes = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const loginData = await loginRes.json();

      if (loginRes.ok && loginData.user) {
        login(loginData.user);
        setMessage(`Добро пожаловать, ${loginData.user.username}`);
        setUsername('');
        setPassword('');
        setConfirmPassword('');
        navigate('/news'); // или куда нужно перенаправить
      } else {
        setMessage('Регистрация прошла, но вход не удался');
      }
    } catch (err) {
      setMessage('Сервер недоступен');
      console.error(err);
    }
  };

  return (
    <div>
      <h2>Регистрация</h2>
      <form onSubmit={handleRegister}>
        <input
          type="text"
          placeholder="Логин"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        /><br />
        <input
          type="password"
          placeholder="Пароль"
          value={password}
          autoComplete="off"
          onChange={(e) => setPassword(e.target.value)}
        /><br />
        <input
          type="password"
          placeholder="Повторите пароль"
          value={confirmPassword}
          autoComplete="off"
          onChange={(e) => setConfirmPassword(e.target.value)}
        /><br />
        <button type="submit">Зарегистрироваться</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
}

export default Register;
