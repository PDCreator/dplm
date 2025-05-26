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
          <div key={news.id} style={{ 
            borderBottom: '1px solid #ccc', 
            marginBottom: '1rem',
            padding: '1rem',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <Link to={`/news/${news.id}`} style={{ textDecoration: 'none' }}>
              <h3 style={{ marginTop: 0 }}>{news.title}</h3>
            </Link>
            <p>{news.content}</p>
            <small>{new Date(news.created_at).toLocaleString()}</small>
            
            {news.places && news.places.length > 0 && (
              <div style={{ marginTop: '1rem' }}>
                <h4>Связанные места:</h4>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                  gap: '1rem',
                  marginTop: '0.5rem'
                }}>
                  {news.places.map(place => (
                    <Link 
                      key={place.id} 
                      to={`/places/${place.id}`}
                      style={{
                        textDecoration: 'none',
                        color: 'inherit',
                        border: '1px solid #eee',
                        borderRadius: '6px',
                        padding: '0.5rem',
                        transition: 'transform 0.2s',
                        ':hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                        }
                      }}
                    >
                      {place.image && (
                        <img
                          src={`http://localhost:5000${place.image}`}
                          alt={place.title}
                          style={{
                            width: '100%',
                            height: '120px',
                            objectFit: 'cover',
                            borderRadius: '4px'
                          }}
                        />
                      )}
                      <h5 style={{ margin: '0.5rem 0 0 0' }}>{place.title}</h5>
                      <p style={{
                        margin: '0.3rem 0',
                        fontSize: '0.8rem',
                        color: '#666',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {place.description}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}

export default News;