// routes/favorites.js
const express = require('express');
const router = express.Router();
const db = require('../db');

router.post('/:place_id', (req, res) => {
    const { user_id } = req.body; // предполагаем, что user_id приходит из тела запроса
    const { place_id } = req.params;
  
    const query = 'INSERT INTO favorites (user_id, place_id) VALUES (?, ?)';
    db.query(query, [user_id, place_id], (err, result) => {
      if (err) return res.status(500).json({ error: 'Ошибка при добавлении в избранное' });
      res.json({ message: 'Место добавлено в избранное' });
    });
  });
  

// routes/favorites.js
router.delete('/:place_id', (req, res) => {
    const { user_id } = req.body; // user_id из запроса
    const { place_id } = req.params;
  
    const query = 'DELETE FROM favorites WHERE user_id = ? AND place_id = ?';
    db.query(query, [user_id, place_id], (err, result) => {
      if (err) return res.status(500).json({ error: 'Ошибка при удалении из избранного' });
      res.json({ message: 'Место удалено из избранного' });
    });
  });

  
  // routes/favorites.js
router.get('/user/:user_id', (req, res) => {
    const { user_id } = req.params;
    
    const query = `
      SELECT places.* 
      FROM places 
      JOIN favorites ON places.id = favorites.place_id
      WHERE favorites.user_id = ?
    `;
    db.query(query, [user_id], (err, results) => {
      if (err) return res.status(500).json({ error: 'Ошибка при получении избранных мест' });
      res.json(results);
    });
  });
  
  // Проверить, добавлено ли место в избранное
router.get('/place/:place_id', (req, res) => {
    const { place_id } = req.params;
    const { user_id } = req.query;
  
    if (!user_id) {
      return res.status(400).json({ error: 'user_id обязателен' });
    }
  
    const query = 'SELECT * FROM favorites WHERE user_id = ? AND place_id = ?';
    db.query(query, [user_id, place_id], (err, results) => {
      if (err) return res.status(500).json({ error: 'Ошибка при проверке избранного' });
      res.json({ isFavorited: results.length > 0 });
    });
  });
  
  module.exports = router;