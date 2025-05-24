const express = require('express');
const router = express.Router();
const db = require('../db');
const nodemailer = require('nodemailer');

// Настройка отправки почты
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'flakerdead@gmail.com',
    pass: 'lwxt qcra ygmy nprf'
  }
});

// 📤 Функция отправки письма
function sendEmail(to, subject, html) {
  return transporter.sendMail({
    from: 'flakerdead@gmail.com',
    to,
    subject,
    html
  });
}

// 📥 Получить все новости
router.get('/', (req, res) => {
  db.query('SELECT * FROM news', (err, results) => {
    if (err) return res.status(500).json({ error: 'Ошибка базы данных' });
    res.json(results);
  });
});

// ➕ Добавить новость и связать с местами
router.post('/', (req, res) => {
  const { title, content, placeIds } = req.body;

  if (!title || !content || !Array.isArray(placeIds)) {
    return res.status(400).json({ message: 'Заполните заголовок, содержимое и места' });
  }

  const insertNewsQuery = 'INSERT INTO news (title, content, created_at) VALUES (?, ?, NOW())';
  db.query(insertNewsQuery, [title, content], (err, result) => {
    if (err) return res.status(500).json({ message: 'Ошибка при добавлении новости' });

    const newsId = result.insertId;

    // Привязка к местам
    const values = placeIds.map(placeId => [newsId, placeId]);
    db.query('INSERT INTO news_places (news_id, place_id) VALUES ?', [values], (err2) => {
      if (err2) console.error('Ошибка при привязке мест:', err2);

      // Поиск пользователей с этими местами в избранном и подтвержденным email
      const usersQuery = `
        SELECT DISTINCT u.email FROM users u
        JOIN favorites f ON f.user_id = u.id
        WHERE f.place_id IN (?) AND u.email IS NOT NULL AND u.email_verified = 1
      `;

      db.query(usersQuery, [placeIds], (err3, users) => {
        if (err3) {
          console.error('Ошибка при получении пользователей:', err3);
          return res.status(500).json({ message: 'Новость добавлена, но рассылка не удалась' });
        }

        // Рассылка email
        const emailPromises = users.map(user => sendEmail(
          user.email,
          'Новая новость о вашем избранном месте',
          `<p>Появилась новая новость: <strong>${title}</strong></p><p>${content}</p>`
        ));

        Promise.allSettled(emailPromises)
          .then(() => {
            res.json({ message: 'Новость добавлена и письма отправлены', id: newsId });
          })
          .catch(() => {
            res.status(500).json({ message: 'Новость добавлена, но письма не отправлены' });
          });
      });
    });
  });
});

// ✏️ Обновить новость
router.put('/:id', (req, res) => {
  const { title, content } = req.body;
  const { id } = req.params;

  if (!title || !content) {
    return res.status(400).json({ message: 'Заполните заголовок и содержимое' });
  }

  db.query('UPDATE news SET title = ?, content = ? WHERE id = ?', [title, content, id], (err) => {
    if (err) return res.status(500).json({ message: 'Ошибка при обновлении' });
    res.json({ message: 'Новость обновлена' });
  });
});

// ❌ Удалить новость
router.delete('/:id', (req, res) => {
  const { id } = req.params;

  db.query('DELETE FROM news WHERE id = ?', [id], (err) => {
    if (err) return res.status(500).json({ message: 'Ошибка при удалении' });
    res.json({ message: 'Новость удалена' });
  });
});

// 🔍 Получить новость по ID
router.get('/:id', (req, res) => {
  const { id } = req.params;

  db.query('SELECT * FROM news WHERE id = ?', [id], (err, results) => {
    if (err) return res.status(500).json({ message: 'Ошибка при получении' });
    if (results.length === 0) return res.status(404).json({ message: 'Новость не найдена' });
    res.json(results[0]);
  });
});

module.exports = router;
