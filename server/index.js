const express = require('express');
const cors = require('cors');
const db = require('./db');
const commentRoutes = require('./routes/comments');
const likeRoutes = require('./routes/likes');
const placeRoutes = require('./routes/places');
const favoritesRoutes = require('./routes/favorites');
const userRoutes = require('./routes/users');
const newsRoutes = require('./routes/news');


require('dotenv').config();


const app = express();
// 📌 Добавь это:
app.use(express.json()); // чтобы читать JSON из body
app.use(cors());
app.use('/uploads', express.static('uploads'));
app.use('/api/places', placeRoutes);
app.use('/api/news', newsRoutes);

app.use('/api/comments', commentRoutes);
app.use('/api/likes', likeRoutes);

app.use('/api/favorites', favoritesRoutes);

const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);
app.use(cors());
app.use(express.json());

app.use('/api/users', userRoutes);


app.get('/', (req, res) => {
    res.send('Backend работает!');
  });
app.listen(process.env.PORT, () => {
  console.log(`Сервер запущен на порту ${process.env.PORT}`);
});