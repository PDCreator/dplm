const express = require('express');
const cors = require('cors');
const db = require('./db');

require('dotenv').config();


const app = express();
// 📌 Добавь это:
app.use(express.json()); // чтобы читать JSON из body
app.use(cors());

const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);
app.use(cors());
app.use(express.json());

// Пример запроса
app.get('/api/news', (req, res) => {
    db.query('SELECT * FROM news', (err, results) => {
      if (err) {
        console.error('Ошибка запроса:', err);
        return res.status(500).json({ error: 'Ошибка базы данных' });
      }
      res.json(results);
    });
  });

app.post('/api/news', (req, res) => {
    const { title, content } = req.body;
  
    if (!title || !content) {
      return res.status(400).json({ message: 'Заполните заголовок и содержимое' });
    }
  
    const query = 'INSERT INTO news (title, content, created_at) VALUES (?, ?, NOW())';
    db.query(query, [title, content], (err, result) => {
      if (err) {
        console.error('Ошибка при добавлении новости:', err);
        return res.status(500).json({ message: 'Ошибка при добавлении новости' });
      }
      res.json({ message: 'Новость успешно добавлена', id: result.insertId });
    });
  });

// Обновить новость
app.put('/api/news/:id', (req, res) => {
  const { title, content } = req.body;
  const { id } = req.params;

  if (!title || !content) {
    return res.status(400).json({ message: 'Заполните заголовок и содержимое' });
  }

  const query = 'UPDATE news SET title = ?, content = ? WHERE id = ?';
  db.query(query, [title, content, id], (err, result) => {
    if (err) {
      console.error('Ошибка при обновлении новости:', err);
      return res.status(500).json({ message: 'Ошибка при обновлении' });
    }
    res.json({ message: 'Новость обновлена' });
  });
});

// Удалить новость
app.delete('/api/news/:id', (req, res) => {
  const { id } = req.params;

  const query = 'DELETE FROM news WHERE id = ?';
  db.query(query, [id], (err, result) => {
    if (err) {
      console.error('Ошибка при удалении новости:', err);
      return res.status(500).json({ message: 'Ошибка при удалении' });
    }
    res.json({ message: 'Новость удалена' });
  });
});

app.get('/', (req, res) => {
    res.send('Backend работает!');
  });
app.listen(process.env.PORT, () => {
  console.log(`Сервер запущен на порту ${process.env.PORT}`);
});