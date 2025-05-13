const express = require('express');
const router = express.Router();
const db = require('../db');

// Получить количество лайков и лайкнул ли пользователь
router.get('/:newsId', (req, res) => {
  const { newsId } = req.params;
  const userId = req.query.user_id;

  const countQuery = 'SELECT COUNT(*) AS likeCount FROM likes WHERE news_id = ?';
  const userLikeQuery = 'SELECT * FROM likes WHERE news_id = ? AND user_id = ?';

  db.query(countQuery, [newsId], (err, countResult) => {
    if (err) return res.status(500).json({ error: 'Ошибка получения лайков' });

    db.query(userLikeQuery, [newsId, userId], (err, userResult) => {
      if (err) return res.status(500).json({ error: 'Ошибка проверки лайка' });

      res.json({
        likeCount: countResult[0].likeCount,
        likedByUser: userResult.length > 0
      });
    });
  });
});

// Поставить или снять лайк
router.post('/:newsId', (req, res) => {
  const { newsId } = req.params;
  const { user_id } = req.body;

  const checkQuery = 'SELECT * FROM likes WHERE news_id = ? AND user_id = ?';
  const insertQuery = 'INSERT INTO likes (news_id, user_id) VALUES (?, ?)';
  const deleteQuery = 'DELETE FROM likes WHERE news_id = ? AND user_id = ?';

  db.query(checkQuery, [newsId, user_id], (err, results) => {
    if (err) return res.status(500).json({ error: 'Ошибка проверки лайка' });

    if (results.length > 0) {
      // Удалить лайк
      db.query(deleteQuery, [newsId, user_id], (err) => {
        if (err) return res.status(500).json({ error: 'Ошибка удаления лайка' });
        res.json({ message: 'Лайк удалён' });
      });
    } else {
      // Добавить лайк
      db.query(insertQuery, [newsId, user_id], (err) => {
        if (err) return res.status(500).json({ error: 'Ошибка добавления лайка' });
        res.json({ message: 'Лайк поставлен' });
      });
    }
  });
});

module.exports = router;
