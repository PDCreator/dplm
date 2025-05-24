// routes/places.js
const express = require('express');
const router = express.Router();
const db = require('../db');
const upload = require('../middleware/upload');
const fs = require('fs');
const path = require('path');

// Получить все места
router.get('/', (req, res) => {
  const { search, tags } = req.query;
  let query = `
    SELECT p.*, 
           (SELECT image_url FROM place_images WHERE place_id = p.id LIMIT 1) AS image
    FROM places p 
    WHERE 1
  `;
  const params = [];

  if (search) {
    query += ' AND (p.title LIKE ? OR p.description LIKE ?)';
    const s = `%${search}%`;
    params.push(s, s);
  }

  if (tags) {
    const tagsArray = tags.split(',');
    const tagConditions = tagsArray.map(() => `p.tags LIKE ?`).join(' OR ');
    query += ` AND (${tagConditions})`;
    tagsArray.forEach(tag => params.push(`%${tag}%`));
  }

  db.query(query, params, (err, results) => {
    if (err) {
      console.error('Ошибка при получении мест с фильтрацией:', err);
      return res.status(500).json({ error: 'Ошибка сервера' });
    }
    res.json(results);
  });
});


// Добавить новое место
// POST
router.post('/', upload.array('images'), (req, res) => {
  const { title, description, latitude, longitude, tags } = req.body;
  const files = req.files;
  
  db.query(
    'INSERT INTO places (title, description, latitude, longitude, tags) VALUES (?, ?, ?, ?, ?)',
    [title, description, latitude, longitude, tags],
    (err, result) => {
      if (err) {
        console.error('Ошибка при добавлении места:', err); // <=== добавь это
        return res.status(500).json({ error: 'Ошибка при добавлении' });
      }
  
      const placeId = result.insertId;
  
      // Если есть изображения, добавим их
      if (files && files.length > 0) {
        const values = files.map(file => [placeId, `/uploads/${file.filename}`]);
        db.query(
          'INSERT INTO place_images (place_id, image_url) VALUES ?',
          [values],
          (imgErr) => {
            if (imgErr) {
              console.error('Ошибка при сохранении изображений:', imgErr);
              return res.status(500).json({ error: 'Место добавлено, но изображения не сохранены' });
            }
            res.json({ message: 'Место и изображения добавлены', id: placeId });
          }
        );
      } else {
        res.json({ message: 'Место добавлено без изображений', id: placeId });
      }
    }
  );
});

// Обновить место
// PUT
router.put('/:id', upload.array('images'), (req, res) => {
  const { id } = req.params;
  const { title, description, latitude, longitude, tags } = req.body;
  const files = req.files;

  db.query(
    'UPDATE places SET title = ?, description = ?, latitude = ?, longitude = ?, tags = ? WHERE id = ?',
    [title, description, latitude, longitude, tags, id],
    (err) => {
      if (err) return res.status(500).json({ error: 'Ошибка при обновлении' });

      if (files && files.length > 0) {
        const values = files.map(file => [id, `/uploads/${file.filename}`]);
        db.query(
          'INSERT INTO place_images (place_id, image_url) VALUES ?',
          [values],
          (imgErr) => {
            if (imgErr) {
              console.error('Ошибка при сохранении изображений:', imgErr);
              return res.status(500).json({ error: 'Место обновлено, изображения не сохранены' });
            }
            res.json({ message: 'Место и изображения обновлены' });
          }
        );
      } else {
        res.json({ message: 'Место обновлено (без новых изображений)' });
      }
    }
  );
});
  
  // Удалить место
  router.delete('/:id', (req, res) => {
    const { id } = req.params;
    db.query('DELETE FROM places WHERE id = ?', [id], (err, result) => {
      if (err) return res.status(500).json({ error: 'Ошибка при удалении' });
      res.json({ message: 'Место удалено' });
    });
  });
  
// Получить конкретное место по ID
router.get('/:id', (req, res) => {
  const { id } = req.params;

  // Сначала получаем основную информацию о месте
  db.query('SELECT * FROM places WHERE id = ?', [id], (err, results) => {
    if (err) return res.status(500).json({ error: 'Ошибка при получении места' });
    if (results.length === 0) return res.status(404).json({ error: 'Место не найдено' });

    const place = results[0];

    // Затем получаем все изображения
    db.query('SELECT image_url FROM place_images WHERE place_id = ?', [id], (imgErr, imageResults) => {
      if (imgErr) return res.status(500).json({ error: 'Ошибка при получении изображений' });

      place.images = imageResults.map(img => img.image_url);
      res.json(place);
    });
  });
});

module.exports = router;
