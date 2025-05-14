import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../components/api'; // Если ты хранишь API как в профиле

function Places() {
  const [places, setPlaces] = useState([]);

  useEffect(() => {
    fetch(`${API}/places`)
      .then(res => res.json())
      .then(data => setPlaces(data))
      .catch(err => console.error('Ошибка при загрузке мест:', err));
  }, []);

  return (
    <div style={{ padding: '1rem' }}>
      <h2>Все места</h2>

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
                  src={`${API}/uploads/${place.image}`} // или place.image напрямую, если ссылка полная
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
