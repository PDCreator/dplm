import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../components/api';

function Places() {
  const [places, setPlaces] = useState([]);
  const [search, setSearch] = useState('');
  const [availableTags, setAvailableTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);

  const fetchPlaces = () => {
    const query = new URLSearchParams();
    if (search) query.append('search', search);
    if (selectedTags.length > 0) {
      query.append('tags', selectedTags.map(tag => tag.id).join(','));
    }

    fetch(`${API}/places?${query.toString()}`)
      .then(res => res.json())
      .then(data => setPlaces(data))
      .catch(err => console.error('Ошибка при загрузке мест:', err));
  };

  const fetchTags = () => {
    fetch(`${API}/places/tags`)
      .then(res => res.json())
      .then(data => setAvailableTags(data))
      .catch(err => console.error('Ошибка при загрузке тегов:', err));
  };

  useEffect(() => {
    fetchPlaces();
    fetchTags();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchPlaces();
  };

  const handleTagSelect = (tag) => {
    if (!selectedTags.some(t => t.id === tag.id)) {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleTagRemove = (tagId) => {
    setSelectedTags(selectedTags.filter(tag => tag.id !== tagId));
  };

  return (
    <div style={{ padding: '1rem' }}>
      <h2>Все места</h2>

      <form onSubmit={handleSearchSubmit} style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <input
            type="text"
            placeholder="Поиск по названию или описанию"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ flex: 1, padding: '0.5rem' }}
          />
          <button type="submit" style={{ padding: '0.5rem 1rem' }}>Найти</button>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
          {selectedTags.map(tag => (
            <span 
              key={tag.id} 
              style={{
                background: '#e0f2fe',
                padding: '0.3rem 0.6rem',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                fontSize: '0.9rem'
              }}
            >
              {tag.name}
              <button 
                type="button" 
                onClick={() => handleTagRemove(tag.id)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  marginLeft: '0.5rem',
                  cursor: 'pointer'
                }}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </form>

      <div style={{ marginBottom: '1rem' }}>
        <h4>Фильтр по тегам:</h4>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {availableTags.map(tag => (
            <button
              key={tag.id}
              type="button"
              onClick={() => handleTagSelect(tag)}
              style={{
                background: selectedTags.some(t => t.id === tag.id) ? '#1e40af' : '#e0f2fe',
                color: selectedTags.some(t => t.id === tag.id) ? 'white' : '#1e40af',
                border: 'none',
                padding: '0.3rem 0.6rem',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              {tag.name}
            </button>
          ))}
        </div>
      </div>

      {places.length > 0 ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
          gap: '1.5rem'
        }}>
          {places.map(place => (
            <div key={place.id} style={{
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '1rem',
              boxShadow: '0 2px 6px rgba(0,0,0,0.05)'
            }}>
              <Link to={`/places/${place.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <h3 style={{ margin: '0 0 0.5rem 0', color: '#1e40af' }}>{place.title}</h3>
              </Link>

              {place.image && (
                <Link to={`/places/${place.id}`}>
                  <img
                    src={`http://localhost:5000${place.image}`}
                    alt={place.title}
                    style={{
                      width: '100%',
                      height: '160px',
                      objectFit: 'cover',
                      borderRadius: '6px',
                      marginBottom: '0.75rem'
                    }}
                  />
                </Link>
              )}

              {place.description && (
                <p style={{
                  margin: '0.5rem 0',
                  fontSize: '0.9rem',
                  color: '#4b5563',
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  minHeight: '4.5em'
                }}>
                  {place.description}
                </p>
              )}

              {place.tags && place.tags.length > 0 && (
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '0.5rem',
                  marginTop: '0.75rem'
                }}>
                  {place.tags.map(tag => (
                    <span 
                      key={tag.id} 
                      style={{
                        background: '#e0f2fe',
                        color: '#0369a1',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.75rem'
                      }}
                    >
                      {tag.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div style={{
          padding: '2rem',
          textAlign: 'center',
          color: '#64748b'
        }}>
          <p style={{ fontSize: '1.1rem' }}>Ничего не найдено</p>
          <p>Попробуйте изменить параметры поиска</p>
        </div>
      )}
    </div>
  );
}

export default Places;