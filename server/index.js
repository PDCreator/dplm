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
app.get('/', (req, res) => {
    res.send('Backend работает!');
  });
app.listen(process.env.PORT, () => {
  console.log(`Сервер запущен на порту ${process.env.PORT}`);
});