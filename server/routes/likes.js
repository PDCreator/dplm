const express = require('express');
const router = express.Router();
const db = require('../db');

// Получить количество лайков и лайкнул ли пользователь
router.get('/:targetType/:targetId', (req, res) => {
  const { targetType, targetId } = req.params;
  const userId = req.query.user_id;

  const countQuery = `
    SELECT COUNT(*) AS likeCount 
    FROM likes 
    WHERE target_type = ? AND target_id = ?
  `;
  const userLikeQuery = `
    SELECT * FROM likes 
    WHERE target_type = ? AND target_id = ? AND user_id = ?
  `;

  db.query(countQuery, [targetType, targetId], (err, countResult) => {
    if (err) return res.status(500).json({ error: 'Ошибка получения лайков' });

    if (!userId) {
      return res.json({
        likeCount: countResult[0].likeCount,
        likedByUser: false
      });
    }

    db.query(userLikeQuery, [targetType, targetId, userId], (err, userResult) => {
      if (err) return res.status(500).json({ error: 'Ошибка проверки лайка' });

      res.json({
        likeCount: countResult[0].likeCount,
        likedByUser: userResult.length > 0
      });
    });
  });
});

// Поставить или снять лайк
router.post('/:targetType/:targetId', (req, res) => {
  const { targetType, targetId } = req.params;
  const { user_id } = req.body;

  const checkQuery = `
    SELECT * FROM likes 
    WHERE target_type = ? AND target_id = ? AND user_id = ?
  `;
  const insertQuery = `
    INSERT INTO likes (target_type, target_id, user_id) 
    VALUES (?, ?, ?)
  `;
  const deleteQuery = `
    DELETE FROM likes 
    WHERE target_type = ? AND target_id = ? AND user_id = ?
  `;

  db.query(checkQuery, [targetType, targetId, user_id], (err, results) => {
    if (err) return res.status(500).json({ error: 'Ошибка проверки лайка' });

    if (results.length > 0) {
      // Удалить лайк
      db.query(deleteQuery, [targetType, targetId, user_id], (err) => {
        if (err) return res.status(500).json({ error: 'Ошибка удаления лайка' });
        res.json({ message: 'Лайк удалён' });
      });
    } else {
      // Добавить лайк
      db.query(insertQuery, [targetType, targetId, user_id], (err) => {
        if (err) return res.status(500).json({ error: 'Ошибка добавления лайка' });
        res.json({ message: 'Лайк поставлен' });
      });
    }
  });
});

module.exports = router;
