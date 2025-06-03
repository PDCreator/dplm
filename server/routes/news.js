const express = require('express');
const router = express.Router();
const db = require('../db');
const nodemailer = require('nodemailer');

// Настройка отправки почты
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Функция отправки письма
function sendEmail(to, subject, html) {
  return transporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject,
    html
  });
}

// Получить все новости с местами
router.get('/', (req, res) => {
  db.query('SELECT * FROM news ORDER BY created_at DESC', (err, newsResults) => {
    if (err) return res.status(500).json({ error: 'Ошибка базы данных' });
    
    if (newsResults.length === 0) return res.json([]);
    
    const newsIds = newsResults.map(n => n.id);
    
    // Получаем все связи новостей с местами
    db.query(`
      SELECT np.news_id, p.id, p.title, p.description, 
        (SELECT image_url FROM place_images WHERE place_id = p.id LIMIT 1) AS image
      FROM news_places np
      JOIN places p ON np.place_id = p.id
      WHERE np.news_id IN (?)
    `, [newsIds], (placeErr, placeResults) => {
      if (placeErr) {
        console.error('Ошибка при получении мест:', placeErr);
        return res.json(newsResults); 
      }
      
      // Группируем места по новостям
      const placesByNews = placeResults.reduce((acc, place) => {
        if (!acc[place.news_id]) acc[place.news_id] = [];
        acc[place.news_id].push(place);
        return acc;
      }, {});
      
      // Добавляем места к новостям
      const newsWithPlaces = newsResults.map(news => ({
        ...news,
        places: placesByNews[news.id] || []
      }));
      
      res.json(newsWithPlaces);
    });
  });
});


// Добавить новость и связать с местами
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

      // Получаем информацию о местах для письма
      db.query('SELECT id, title FROM places WHERE id IN (?)', [placeIds], (placeErr, places) => {
        if (placeErr) {
          console.error('Ошибка при получении информации о местах:', placeErr);
          return res.status(500).json({ message: 'Новость добавлена, но рассылка не удалась' });
        }

        const placeMap = places.reduce((acc, place) => {
          acc[place.id] = place.title;
          return acc;
        }, {});

        const usersQuery = `
          SELECT DISTINCT u.email, f.place_id FROM users u
          JOIN favorites f ON f.user_id = u.id
          WHERE f.place_id IN (?) AND u.email IS NOT NULL AND u.email_verified = 1
        `;

        db.query(usersQuery, [placeIds], (err3, users) => {
          if (err3) {
            console.error('Ошибка при получении пользователей:', err3);
            return res.status(500).json({ message: 'Новость добавлена, но рассылка не удалась' });
          }

          const userEmails = [...new Set(users.map(u => u.email))];

          // Рассылка email
          const emailPromises = userEmails.map(email => {
            const userPlaces = users
              .filter(u => u.email === email)
              .map(u => placeMap[u.place_id]);

            const placeTitles = userPlaces.map(title => `• ${title}`).join('<br>');
            const newsLink = `http://localhost:3000/news/${newsId}`;

            return sendEmail(
              email,
              'Новая новость о ваших избранных местах',
              `
                <h3>Новая новость связана с вашими избранными местами:</h3>
                ${placeTitles}
                <h4 style="margin-top: 20px;">${title}</h4>
                <p>${content}</p>
                <p style="margin-top: 20px;">
                  <a href="${newsLink}" style="
                    background-color: #4CAF50;
                    color: white;
                    padding: 10px 20px;
                    text-decoration: none;
                    border-radius: 5px;
                  ">Читать новость</a>
                </p>
              `
            );
          });

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
});

// Обновить новость
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

// Удалить новость
router.delete('/:id', (req, res) => {
  const { id } = req.params;

  db.beginTransaction(err => {
    if (err) return res.status(500).json({ message: 'Ошибка начала транзакции' });

    // 1. Удаляем комментарии к новости
    db.query('DELETE FROM comments WHERE target_type = "news" AND target_id = ?', [id], (err) => {
      if (err) return db.rollback(() => {
        res.status(500).json({ message: 'Ошибка при удалении комментариев' });
      });

      // 2. Удаляем лайки новости
      db.query('DELETE FROM likes WHERE target_type = "news" AND target_id = ?', [id], (err) => {
        if (err) return db.rollback(() => {
          res.status(500).json({ message: 'Ошибка при удалении лайков' });
        });

        // 3. Удаляем связи с местами
        db.query('DELETE FROM news_places WHERE news_id = ?', [id], (err) => {
          if (err) return db.rollback(() => {
            res.status(500).json({ message: 'Ошибка при удалении связей с местами' });
          });

          // 4. Удаляем саму новость
          db.query('DELETE FROM news WHERE id = ?', [id], (err) => {
            if (err) return db.rollback(() => {
              res.status(500).json({ message: 'Ошибка при удалении новости' });
            });

            // Фиксируем транзакцию
            db.commit(err => {
              if (err) return db.rollback(() => {
                res.status(500).json({ message: 'Ошибка фиксации транзакции' });
              });
              
              res.json({ message: 'Новость и все связанные данные удалены' });
            });
          });
        });
      });
    });
  });
});

// Получить новость по ID с местами
router.get('/:id', (req, res) => {
  const { id } = req.params;

  db.query('SELECT * FROM news WHERE id = ?', [id], (err, newsResults) => {
    if (err) return res.status(500).json({ message: 'Ошибка при получении' });
    if (newsResults.length === 0) return res.status(404).json({ message: 'Новость не найдена' });
    
    const news = newsResults[0];
    
    // Получаем связанные места
    db.query(`
      SELECT p.id, p.title, p.description, 
        (SELECT image_url FROM place_images WHERE place_id = p.id LIMIT 1) AS image
      FROM places p
      JOIN news_places np ON np.place_id = p.id
      WHERE np.news_id = ?
    `, [id], (placeErr, placeResults) => {
      if (placeErr) {
        console.error('Ошибка при получении мест:', placeErr);
        return res.json(news);
      }
      
      news.places = placeResults;
      res.json(news);
    });
  });
});
// Получить новости по месту
router.get('/by-place/:placeId', (req, res) => {
  const { placeId } = req.params;
  const query = `
    SELECT n.* FROM news n
    JOIN news_places np ON np.news_id = n.id
    WHERE np.place_id = ?
    ORDER BY n.created_at DESC
  `;
  db.query(query, [placeId], (err, results) => {
    if (err) return res.status(500).json({ error: 'Ошибка при загрузке новостей' });
    res.json(results);
  });
});


module.exports = router;
