import { useState } from 'react';

function Register() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleRegister = async (e) => {
    e.preventDefault();

    // Простейшая валидация
    if (!/^[a-zA-Z0-9]+$/.test(username)) {
      return setMessage('Логин должен содержать только латинские буквы и цифры');
    }
    if (password.length < 8) {
      return setMessage('Пароль должен быть минимум 8 символов');
    }
    const pwd = password.trim();
    const confirm = confirmPassword.trim();

    console.log('Password:', `"${pwd}"`);
    console.log('Confirm:', `"${confirm}"`);

    if (pwd !== confirm) {
        //return setMessage('Пароли не совпадают');
    }
    console.log('Отправка:', { username, password });

    try {
      const res = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage('Регистрация прошла успешно!');
        setUsername('');
        setPassword('');
        setConfirmPassword('');
      } else {
        setMessage(data.message || 'Ошибка регистрации');
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
