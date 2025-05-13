// routes/places.js
const express = require('express');
const router = express.Router();
const db = require('../db');

// Получить все места
router.get('/', (req, res) => {
  db.query('SELECT * FROM places', (err, results) => {
    if (err) return res.status(500).json({ error: 'Ошибка базы' });
    res.json(results);
  });
});

// Добавить новое место
router.post('/', (req, res) => {
  const { title, description, location, tags, image } = req.body;
  const query = 'INSERT INTO places (title, description, location, tags, image) VALUES (?, ?, ?, ?, ?)';
  db.query(query, [title, description, location, tags, image], (err, result) => {
    if (err) return res.status(500).json({ error: 'Ошибка при добавлении' });
    res.json({ message: 'Место добавлено', id: result.insertId });
  });
});

// Обновить место
router.put('/:id', (req, res) => {
    const { id } = req.params;
    const { title, description, location, tags, image } = req.body;
    const query = 'UPDATE places SET title = ?, description = ?, location = ?, tags = ?, image = ? WHERE id = ?';
    db.query(query, [title, description, location, tags, image, id], (err, result) => {
      if (err) return res.status(500).json({ error: 'Ошибка при обновлении' });
      res.json({ message: 'Место обновлено' });
    });
  });
  
  // Удалить место
  router.delete('/:id', (req, res) => {
    const { id } = req.params;
    db.query('DELETE FROM places WHERE id = ?', [id], (err, result) => {
      if (err) return res.status(500).json({ error: 'Ошибка при удалении' });
      res.json({ message: 'Место удалено' });
    });
  });
  

module.exports = router;
