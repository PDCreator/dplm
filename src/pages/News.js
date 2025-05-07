// src/pages/News.js
import { useEffect, useState } from 'react';

function News() {
  const [newsList, setNewsList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:5000/api/news')
      .then((res) => res.json())
      .then((data) => {
        setNewsList(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Ошибка загрузки новостей:', err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Загрузка новостей...</div>;

  return (
    <div style={{ padding: '1rem' }}>
      <h2>Новости</h2>
      {newsList.length === 0 ? (
        <p>Пока нет новостей</p>
      ) : (
        newsList.map((news) => (
          <div key={news.id} style={{ borderBottom: '1px solid #ccc', marginBottom: '1rem' }}>
            <h3>{news.title}</h3>
            <p>{news.content}</p>
            <small>{new Date(news.created_at).toLocaleString()}</small>
          </div>
        ))
      )}
    </div>
  );
}

export default News;
