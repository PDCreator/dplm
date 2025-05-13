const express = require('express');
const router = express.Router();
const db = require('../db');

// Получить комментарии к новости
router.get('/:newsId', (req, res) => {
  const { newsId } = req.params;
  const query = `
    SELECT comments.*, users.username 
    FROM comments 
    JOIN users ON comments.user_id = users.id 
    WHERE news_id = ? 
    ORDER BY created_at DESC
  `;
  db.query(query, [newsId], (err, results) => {
    if (err) return res.status(500).json({ error: 'Ошибка получения комментариев' });
    res.json(results);
  });
});

// Добавить комментарий
router.post('/:newsId', (req, res) => {
  const { newsId } = req.params;
  const { user_id, content } = req.body;

  if (!user_id || !content) {
    return res.status(400).json({ error: 'Текст комментария и ID пользователя обязательны' });
  }

  const query = 'INSERT INTO comments (news_id, user_id, content) VALUES (?, ?, ?)';
  db.query(query, [newsId, user_id, content], (err) => {
    if (err) return res.status(500).json({ error: 'Ошибка при добавлении комментария' });
    res.json({ message: 'Комментарий добавлен' });
  });
});

module.exports = router;
