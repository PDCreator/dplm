const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../db');

const nodemailer = require('nodemailer');
const crypto = require('crypto');
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
      res.json({ message: 'Успешный вход', user: { id: user.id, username: user.username, is_admin: user.is_admin } });
    });
  });



  // Настройка почты (лучше вынести в .env)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

router.get('/verify-email', (req, res) => {
  const { token } = req.query;

  if (!token) return res.status(400).send('Недопустимый токен');

  db.query('SELECT * FROM users WHERE email_verification_token = ?', [token], (err, results) => {
    if (err || results.length === 0) return res.status(400).send('Недействительный токен');

    const user = results[0];
    db.query('UPDATE users SET email_verified = 1, email_verification_token = NULL WHERE id = ?', [user.id], (err2) => {
      if (err2) return res.status(500).send('Ошибка при подтверждении');
      res.send('Email подтверждён успешно');
    });
  });
  res.redirect('http://localhost:3000/profile?verified=1');
});
router.post('/set-email', (req, res) => {
  const { user_id, email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email обязателен' });

  const token = crypto.randomBytes(32).toString('hex');
  const verificationLink = `http://localhost:5000/api/auth/verify-email?token=${token}`;

  // Сохраняем токен в БД — можно отдельную таблицу или временно в `users`
  db.query('UPDATE users SET email = ?, email_verified = 0, email_verification_token = ? WHERE id = ?', 
    [email, token, user_id], (err) => {
    if (err) return res.status(500).json({ message: 'Ошибка при обновлении email' });

    // Отправка письма
    const mailOptions = {
      from: 'flakerdead@gmail.com',
      to: email,
      subject: 'Подтверждение Email',
      html: `
        <p>Здравствуйте!</p>
        <p>Пожалуйста, подтвердите ваш email, перейдя по следующей ссылке:</p>
        <p><a href="${verificationLink}" target="_blank">Подтвердить Email</a></p>
        <p>Если вы не запрашивали подтверждение, просто проигнорируйте это письмо.</p>
      `
    };

    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: 'Ошибка при отправке письма' });
      }
      res.json({ message: 'Письмо отправлено на email' });
    });
  });
});
module.exports = router;
