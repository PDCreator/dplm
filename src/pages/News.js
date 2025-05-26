import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Select from 'react-select';

function News() {
  const [newsList, setNewsList] = useState([]);
  const [places, setPlaces] = useState([]);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:5000/api/news')
      .then(res => res.json())
      .then(data => {
        setNewsList(data);
        setLoading(false);
      });

    fetch('http://localhost:5000/api/places/names')
      .then(res => res.json())
      .then(data => {
        console.log('data from API:', data); // <-- сюда
        const options = data.map(p => ({ value: p.id, label: p.name }));
        setPlaces(options);
      });
  }, []);

  const handlePlaceChange = (option) => {
    setSelectedPlace(option);
    if (option) {
      setLoading(true);
      fetch(`http://localhost:5000/api/news/by-place/${option.value}`)
        .then(res => res.json())
        .then(data => {
          setNewsList(data);
          setLoading(false);
        });
    } else {
      // Показать все новости при сбросе
      fetch('http://localhost:5000/api/news')
        .then(res => res.json())
        .then(data => setNewsList(data));
    }
  };

  return (
    <div style={{ padding: '1rem' }}>
      <h2>Новости</h2>

      <div style={{ maxWidth: 400, marginBottom: '1rem' }}>
        <Select
          options={places}
          value={selectedPlace}
          onChange={handlePlaceChange}
          isClearable
          placeholder="Фильтр по месту..."
        />
      </div>

      {loading ? (
        <p>Загрузка новостей...</p>
      ) : newsList.length === 0 ? (
        <p>Пока нет новостей</p>
      ) : (
        newsList.map(news => (
          <div key={news.id} style={{ borderBottom: '1px solid #ccc', marginBottom: '1rem' }}>
            <Link to={`/news/${news.id}`}>{news.title}</Link>
            <p>{news.content}</p>
            <small>{new Date(news.created_at).toLocaleString()}</small>
          </div>
        ))
      )}
    </div>
  );
}

export default News;
