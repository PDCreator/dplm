const express = require('express');
const router = express.Router();
const db = require('../db');

// Получить пользователя по ID
router.get('/:id', (req, res) => {
  const userId = req.params.id;

  db.query('SELECT id, username, email, email_verified FROM users WHERE id = ?', [userId], (err, results) => {
    if (err) return res.status(500).json({ message: 'Ошибка сервера' });
    if (results.length === 0) return res.status(404).json({ message: 'Пользователь не найден' });

    res.json(results[0]);
  });
});

module.exports = router;