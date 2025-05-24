import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../components/api'; // API базовый путь

function Places() {
  const [places, setPlaces] = useState([]);
  const [search, setSearch] = useState('');
  const [tagsInput, setTagsInput] = useState('');

  const fetchPlaces = () => {
    const query = new URLSearchParams();
    if (search) query.append('search', search);
    if (tagsInput) query.append('tags', tagsInput);

    fetch(`${API}/places?${query.toString()}`)
      .then(res => res.json())
      .then(data => setPlaces(data))
      .catch(err => console.error('Ошибка при загрузке мест:', err));
  };

  useEffect(() => {
    fetchPlaces();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    fetchPlaces();
  };

  return (
    <div style={{ padding: '1rem' }}>
      <h2>Все места</h2>

      <form onSubmit={handleSubmit} style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Поиск по названию или описанию"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ flex: '1 1 200px', padding: '0.5rem' }}
        />
        <input
          type="text"
          placeholder="Теги (через запятую)"
          value={tagsInput}
          onChange={e => setTagsInput(e.target.value)}
          style={{ flex: '1 1 200px', padding: '0.5rem' }}
        />
        <button type="submit" style={{ padding: '0.5rem 1rem' }}>Найти</button>
      </form>

      {places.length > 0 ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: '1rem'
        }}>
          {places.map(place => (
            <div key={place.id} style={{
              border: '1px solid #ccc',
              borderRadius: '8px',
              padding: '1rem',
              textAlign: 'center',
              boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
            }}>
              <Link to={`/places/${place.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <h4>{place.title}</h4>
              </Link>

              {place.image && (
                <img
                  src={`http://localhost:5000${place.image}`}
                  alt={place.title}
                  style={{
                    width: '100%',
                    height: '150px',
                    objectFit: 'cover',
                    borderRadius: '6px',
                    marginTop: '0.5rem'
                  }}
                />
              )}

              {place.description && (
                <p style={{
                  marginTop: '0.5rem',
                  fontSize: '0.9rem',
                  color: '#555',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {place.description}
                </p>
              )}

              {place.tags && (
                <div style={{
                  marginTop: '0.5rem',
                  fontSize: '0.85rem',
                  color: '#0077cc'
                }}>
                  #{place.tags.split(',').map(tag => tag.trim()).join(' #')}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p>Нет доступных мест.</p>
      )}
    </div>
  );
}

export default Places;
