const express = require('express');
const router = express.Router();
const db = require('../db');

// Получить все достижения пользователя
router.get('/user/:userId', (req, res) => {
  const { userId } = req.params;

  db.query(`
    SELECT a.*, 
      CASE WHEN ua.user_id IS NOT NULL THEN TRUE ELSE FALSE END as unlocked,
      ua.unlocked_at
    FROM achievements a
    LEFT JOIN user_achievements ua ON a.id = ua.achievement_id AND ua.user_id = ?
    ORDER BY unlocked DESC, a.id
  `, [userId], (err, results) => {
    if (err) {
      console.error('Ошибка при получении достижений:', err);
      return res.status(500).json({ error: 'Ошибка сервера' });
    }
    res.json(results);
  });
});

// Проверить новые достижения
router.post('/check', (req, res) => {
  const { userId, action, data } = req.body;

  // Для примера - проверка при добавлении в посещенные
  if (action === 'place_visited') {
    checkPlaceAchievements(userId, data.placeId, (err, newAchievements) => {
      if (err) return res.status(500).json({ error: 'Ошибка проверки достижений' });
      res.json({ newAchievements });
    });
  } else {
    res.json({ newAchievements: [] });
  }
});

// Вспомогательная функция для проверки достижений
function checkPlaceAchievements(userId, placeId, callback) {
  // 1. Проверяем количество посещенных мест
  db.query(`
    SELECT COUNT(*) as count 
    FROM visited_places 
    WHERE user_id = ?
  `, [userId], (err, [visitedCount]) => {
    if (err) return callback(err);
    
    const newAchievements = [];
    
    // 2. Проверяем условия достижений
    const checks = [
      { id: 1, condition: visitedCount.count >= 1 },  // Первое посещение
      { id: 2, condition: visitedCount.count >= 5 },  // Исследователь
      { id: 3, condition: visitedCount.count >= 10 }  // Путешественник
    ];
    
    // 3. Проверяем каждое достижение
    checks.forEach(check => {
      if (check.condition) {
        db.query(`
          INSERT IGNORE INTO user_achievements (user_id, achievement_id)
          VALUES (?, ?)
        `, [userId, check.id], (err) => {
          if (!err && err !== 'ER_DUP_ENTRY') {
            newAchievements.push(check.id);
          }
        });
      }
    });
    
    callback(null, newAchievements);
  });
}

module.exports = router;