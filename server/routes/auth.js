const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../db');

router.post('/register', (req, res) => {
  const { username, password} = req.body;

  // Валидация
  if (!username || !password) {
    return res.status(400).json({ message: 'Пожалуйста, заполните все поля' });
  }
  if (!/^[a-zA-Z0-9]+$/.test(username)) {
    return res.status(400).json({ message: 'Логин должен содержать только латинские буквы и цифры' });
  }
  if (password.length < 8) {
    return res.status(400).json({ message: 'Пароль должен быть не менее 8 символов' });
  }


  db.query('SELECT * FROM users WHERE username = ?', [username], (err, results) => {
    if (err) return res.status(500).json({ message: 'Ошибка сервера' });
    if (results.length > 0) {
      return res.status(400).json({ message: 'Пользователь уже существует' });
    }

    // Хэшируем пароль и сохраняем
    bcrypt.hash(password, 10, (err, hashedPassword) => {
      if (err) return res.status(500).json({ message: 'Ошибка хэширования пароля' });

      db.query('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword], (err) => {
        if (err) return res.status(500).json({ message: 'Ошибка при сохранении пользователя' });
        res.status(201).json({ message: 'Пользователь зарегистрирован' });
      });
    });
  });
});

router.post('/login', (req, res) => {
    const { username, password } = req.body;
  
    if (!username || !password) {
      return res.status(400).json({ message: 'Введите логин и пароль' });
    }
  
    const query = 'SELECT * FROM users WHERE username = ?';
    db.query(query, [username], async (err, results) => {
      if (err) {
        console.error('Ошибка при поиске пользователя:', err);
        return res.status(500).json({ message: 'Ошибка сервера' });
      }
  
      if (results.length === 0) {
        return res.status(401).json({ message: 'Неверный логин или пароль' });
      }
  
      const user = results[0];
  
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Неверный логин или пароль' });
      }
  
      // Тут можно добавить токен/сессию, но пока просто ответ:
      res.json({ message: 'Успешный вход', user: { id: user.id, username: user.username } });
    });
  });

module.exports = router;
