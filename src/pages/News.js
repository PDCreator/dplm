import { useEffect, useState } from 'react';

function NewsList() {
  const [news, setNews] = useState([]);

  useEffect(() => {
    fetch('http://localhost:5000/api/news')
      .then(res => res.json())
      .then(data => setNews(data))
      .catch(err => console.error('Ошибка при загрузке новостей:', err));
  }, []);

  return (
    <div>
      <h2>Новости</h2>
      {news.map((item) => (
        <div key={item.id}>
          <h3>{item.title}</h3>
          <p>{item.content}</p>
          <hr />
        </div>
      ))}
    </div>
  );
}

export default NewsList;
