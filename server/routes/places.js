const express = require('express');
const router = express.Router();
const db = require('../db');
const upload = require('../middleware/upload');
const fs = require('fs');
const path = require('path');

// Получить все места с фильтрацией по поиску и тегам
router.get('/', (req, res) => {
  const { search, tags } = req.query;
  const tagIds = tags ? tags.split(',').map(id => parseInt(id)) : [];

  let query = `
    SELECT DISTINCT p.*, 
      (SELECT image_url FROM place_images WHERE place_id = p.id LIMIT 1) AS image
    FROM places p
    LEFT JOIN place_tags pt ON p.id = pt.place_id
    WHERE 1
  `;
  const params = [];

  if (search) {
    query += ' AND (p.title LIKE ? OR p.description LIKE ?)';
    const s = `%${search}%`;
    params.push(s, s);
  }

  if (tagIds.length > 0) {
    const placeholders = tagIds.map(() => '?').join(',');
    query += ` AND pt.tag_id IN (${placeholders})`;
    params.push(...tagIds);
  }

  db.query(query, params, (err, results) => {
    if (err) {
      console.error('Ошибка при получении мест с фильтрацией:', err);
      return res.status(500).json({ error: 'Ошибка сервера' });
    }

    // Для каждого места загружаем теги
    if (results.length === 0) return res.json([]);

    const placeIds = results.map(p => p.id);
    db.query(`
      SELECT pt.place_id, t.id, t.name 
      FROM place_tags pt
      JOIN tags t ON pt.tag_id = t.id
      WHERE pt.place_id IN (?)
    `, [placeIds], (tagErr, tagResults) => {
      if (tagErr) {
        console.error('Ошибка при загрузке тегов:', tagErr);
        return res.status(500).json({ error: 'Ошибка при загрузке тегов' });
      }

      // Группируем теги по place_id
      const tagsByPlace = tagResults.reduce((acc, item) => {
        if (!acc[item.place_id]) acc[item.place_id] = [];
        acc[item.place_id].push({ id: item.id, name: item.name });
        return acc;
      }, {});

      // Добавляем теги к местам
      const placesWithTags = results.map(place => ({
        ...place,
        tags: tagsByPlace[place.id] || []
      }));

      res.json(placesWithTags);
    });
  });
});

// Добавить новое место
router.post('/', upload.array('images'), (req, res) => {
  const { title, description, latitude, longitude, tagIds } = req.body;
  const files = req.files;
  const parsedTagIds = tagIds ? JSON.parse(tagIds) : [];

  db.query(
    'INSERT INTO places (title, description, latitude, longitude) VALUES (?, ?, ?, ?)',
    [title, description, latitude, longitude],
    (err, result) => {
      if (err) {
        console.error('Ошибка при добавлении места:', err);
        return res.status(500).json({ error: 'Ошибка при добавлении' });
      }

      const placeId = result.insertId;

      const insertTags = () => {
        if (parsedTagIds.length > 0) {
          const tagValues = parsedTagIds.map(tagId => [placeId, tagId]);
          db.query(
            'INSERT INTO place_tags (place_id, tag_id) VALUES ?',
            [tagValues],
            (tagErr) => {
              if (tagErr) console.error('Ошибка при привязке тегов:', tagErr);
            }
          );
        }
      };

      const insertImages = () => {
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
      };

      insertTags();
      insertImages();
    }
  );
});

// Обновить место
router.put('/:id', upload.array('images'), (req, res) => {
  const { id } = req.params;
  const { title, description, latitude, longitude, tagIds } = req.body;
  const files = req.files;
  const parsedTagIds = tagIds ? JSON.parse(tagIds) : [];

  db.query(
    'UPDATE places SET title = ?, description = ?, latitude = ?, longitude = ? WHERE id = ?',
    [title, description, latitude, longitude, id],
    (err) => {
      if (err) return res.status(500).json({ error: 'Ошибка при обновлении' });

      // Обновим теги: сначала удалим старые
      db.query('DELETE FROM place_tags WHERE place_id = ?', [id], (delErr) => {
        if (delErr) console.error('Ошибка при удалении старых тегов:', delErr);

        if (parsedTagIds.length > 0) {
          const tagValues = parsedTagIds.map(tagId => [id, tagId]);
          db.query('INSERT INTO place_tags (place_id, tag_id) VALUES ?', [tagValues], (insErr) => {
            if (insErr) console.error('Ошибка при добавлении новых тегов:', insErr);
          });
        }
      });

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

  // Начинаем транзакцию
  db.beginTransaction(err => {
    if (err) return res.status(500).json({ error: 'Ошибка начала транзакции' });

    // 1. Удаляем комментарии к месту
    db.query('DELETE FROM comments WHERE target_type = "place" AND target_id = ?', [id], (err) => {
      if (err) return db.rollback(() => {
        res.status(500).json({ error: 'Ошибка при удалении комментариев' });
      });

      // 2. Удаляем лайки места
      db.query('DELETE FROM likes WHERE target_type = "place" AND target_id = ?', [id], (err) => {
        if (err) return db.rollback(() => {
          res.status(500).json({ error: 'Ошибка при удалении лайков' });
        });

        // 3. Удаляем связи с тегами
        db.query('DELETE FROM place_tags WHERE place_id = ?', [id], (err) => {
          if (err) return db.rollback(() => {
            res.status(500).json({ error: 'Ошибка при удалении тегов' });
          });

          // 4. Удаляем изображения места
          db.query('DELETE FROM place_images WHERE place_id = ?', [id], (err) => {
            if (err) return db.rollback(() => {
              res.status(500).json({ error: 'Ошибка при удалении изображений' });
            });

            // 5. Удаляем связи с новостями
            db.query('DELETE FROM news_places WHERE place_id = ?', [id], (err) => {
              if (err) return db.rollback(() => {
                res.status(500).json({ error: 'Ошибка при удалении связей с новостями' });
              });

              // 6. Удаляем из избранного
              db.query('DELETE FROM favorites WHERE place_id = ?', [id], (err) => {
                if (err) return db.rollback(() => {
                  res.status(500).json({ error: 'Ошибка при удалении из избранного' });
                });

                // 7. Удаляем само место
                db.query('DELETE FROM places WHERE id = ?', [id], (err) => {
                  if (err) return db.rollback(() => {
                    res.status(500).json({ error: 'Ошибка при удалении места' });
                  });

                  // Фиксируем транзакцию
                  db.commit(err => {
                    if (err) return db.rollback(() => {
                      res.status(500).json({ error: 'Ошибка фиксации транзакции' });
                    });
                    
                    res.json({ message: 'Место и все связанные данные удалены' });
                  });
                });
              });
            });
          });
        });
      });
    });
  });
});

// В роуте для получения тегов добавим фильтр
router.get('/tags', (req, res) => {
  const { include_cities } = req.query;
  let query = 'SELECT id, name, is_city FROM tags ORDER BY name';
  
  if (include_cities === 'false') {
    query = 'SELECT id, name, is_city FROM tags WHERE is_city = FALSE ORDER BY name';
  }

  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ error: 'Ошибка при получении тегов' });
    res.json(results);
  });
});

// В роуте добавления тега
router.post('/tags', (req, res) => {
  const { name, is_city } = req.body;
  
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Название тега обязательно' });
  }

  db.query('SELECT id FROM tags WHERE name = ?', [name.trim()], (err, results) => {
    if (err) return res.status(500).json({ error: 'Ошибка при проверке тега' });
    
    if (results.length > 0) {
      return res.status(400).json({ error: 'Тег с таким именем уже существует' });
    }

    db.query('INSERT INTO tags (name, is_city) VALUES (?, ?)', 
      [name.trim(), Boolean(is_city)], 
      (err, result) => {
        if (err) return res.status(500).json({ error: 'Ошибка при добавлении тега' });
        
        res.json({
          id: result.insertId,
          name: name.trim(),
          is_city: Boolean(is_city),
          message: 'Тег успешно добавлен'
        });
      }
    );
  });
});
// Удалить тег
router.delete('/tags/:id', (req, res) => {
  const { id } = req.params;

  // Проверяем, существует ли тег
  db.query('SELECT id FROM tags WHERE id = ?', [id], (err, results) => {
    if (err) {
      console.error('Ошибка при проверке тега:', err);
      return res.status(500).json({ error: 'Ошибка при проверке тега' });
    }
    
    if (results.length === 0) {
      return res.status(404).json({ error: 'Тег не найден' });
    }

    // Начинаем транзакцию для безопасного удаления
    db.beginTransaction(err => {
      if (err) {
        console.error('Ошибка начала транзакции:', err);
        return res.status(500).json({ error: 'Ошибка начала транзакции' });
      }

      // 1. Удаляем связи тега с местами
      db.query('DELETE FROM place_tags WHERE tag_id = ?', [id], (err) => {
        if (err) {
          return db.rollback(() => {
            console.error('Ошибка при удалении связей тега:', err);
            res.status(500).json({ error: 'Ошибка при удалении связей тега' });
          });
        }

        // 2. Удаляем сам тег
        db.query('DELETE FROM tags WHERE id = ?', [id], (err, result) => {
          if (err) {
            return db.rollback(() => {
              console.error('Ошибка при удалении тега:', err);
              res.status(500).json({ error: 'Ошибка при удалении тега' });
            });
          }

          // Фиксируем транзакцию
          db.commit(err => {
            if (err) {
              return db.rollback(() => {
                console.error('Ошибка фиксации транзакции:', err);
                res.status(500).json({ error: 'Ошибка фиксации транзакции' });
              });
            }
            
            res.json({ 
              message: 'Тег и все его связи успешно удалены',
              deletedTagId: id
            });
          });
        });
      });
    });
  });
});

// Получить названия мест (для автокомплита)
router.get('/names', (req, res) => {
  db.query('SELECT id, title AS name FROM places ORDER BY title', (err, results) => {
    if (err) return res.status(500).json({ message: 'Ошибка при загрузке мест' });
    res.json(results);
  });
});

// Получить одно место по ID с изображениями и тегами
router.get('/:id', (req, res) => {
  const { id } = req.params;

  db.query('SELECT * FROM places WHERE id = ?', [id], (err, results) => {
    if (err) return res.status(500).json({ error: 'Ошибка при получении места' });
    if (results.length === 0) return res.status(404).json({ error: 'Место не найдено' });

    const place = results[0];

    db.query('SELECT image_url FROM place_images WHERE place_id = ?', [id], (imgErr, imageResults) => {
      if (imgErr) return res.status(500).json({ error: 'Ошибка при получении изображений' });

      place.images = imageResults.map(img => img.image_url);

      db.query('SELECT tag_id FROM place_tags WHERE place_id = ?', [id], (tagErr, tagResults) => {
        if (tagErr) return res.status(500).json({ error: 'Ошибка при получении тегов' });

        place.tagIds = tagResults.map(t => t.tag_id);
        
        // Получаем полную информацию о тегах
        if (place.tagIds.length > 0) {
          db.query('SELECT id, name FROM tags WHERE id IN (?)', [place.tagIds], (fullTagErr, fullTagResults) => {
            if (fullTagErr) return res.status(500).json({ error: 'Ошибка при получении информации о тегах' });
            
            place.tags = fullTagResults;
            res.json(place);
          });
        } else {
          place.tags = [];
          res.json(place);
        }
      });
    });
  });
});

module.exports = router;