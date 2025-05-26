const express = require('express');
const router = express.Router();
const db = require('../db');

// 🔹 Получить список всех пользователей
router.get('/', (req, res) => {
  db.query('SELECT id, username AS login, email, email_verified, is_admin FROM users', (err, results) => {
    if (err) return res.status(500).json({ message: 'Ошибка сервера' });
    res.json(results);
  });
});

// 🔹 Получить пользователя по ID
router.get('/:id', (req, res) => {
  const userId = req.params.id;

  db.query(
    'SELECT id, username AS login, email, email_verified, is_admin FROM users WHERE id = ?',
    [userId],
    (err, results) => {
      if (err) return res.status(500).json({ message: 'Ошибка сервера' });
      if (results.length === 0) return res.status(404).json({ message: 'Пользователь не найден' });

      res.json(results[0]);
    }
  );
});

// 🔹 Обновить пользователя
router.put('/:id', (req, res) => {
  const userId = req.params.id;
  const { email, is_admin } = req.body;

  db.query(
    'UPDATE users SET email = ?, is_admin = ? WHERE id = ?',
    [email, is_admin, userId],
    (err, result) => {
      if (err) return res.status(500).json({ message: 'Ошибка при обновлении пользователя' });
      res.json({ message: 'Пользователь обновлен' });
    }
  );
});

// 🔹 Удалить пользователя
router.delete('/:id', (req, res) => {
  const userId = req.params.id;

  db.query('DELETE FROM users WHERE id = ?', [userId], (err, result) => {
    if (err) return res.status(500).json({ message: 'Ошибка при удалении пользователя' });
    res.json({ message: 'Пользователь удалён' });
  });
});

module.exports = router;
