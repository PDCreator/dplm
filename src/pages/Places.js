import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../components/api';
import '../styles/Places.css'; // или добавить стили в существующий CSS файл
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
    <div className="page-container">
      <div className="places-header">
        <h1>Все места</h1>
        
        <form onSubmit={handleSearchSubmit} className="search-form">
          <div className="search-input-group">
            <input
              type="text"
              placeholder="Поиск по названию или описанию"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="search-input"
            />
            <button type="submit" className="search-btn">Найти</button>
          </div>

          <div className="selected-tags">
            {selectedTags.map(tag => (
              <span 
                key={tag.id} 
                className="selected-tag"
              >
                {tag.name}
                <button 
                  type="button" 
                  onClick={() => handleTagRemove(tag.id)}
                  className="remove-tag-btn"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </form>

        <div className="tags-filter">
          <h3>Фильтр по тегам:</h3>
          <div className="tags-list">
            {availableTags.map(tag => (
              <button
                key={tag.id}
                type="button"
                onClick={() => handleTagSelect(tag)}
                className={`tag-btn ${selectedTags.some(t => t.id === tag.id) ? 'active' : ''}`}
              >
                {tag.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {places.length > 0 ? (
        <div className="places-grid">
          {places.map(place => (
            <div key={place.id} className="place-card">
              <Link to={`/places/${place.id}`} className="place-link">
                <h2 className="place-title">{place.title}</h2>
              </Link>

              {place.image && (
                <Link to={`/places/${place.id}`} className="place-image-link">
                  <img
                    src={`http://localhost:5000${place.image}`}
                    alt={place.title}
                    className="place-image"
                  />
                </Link>
              )}

              {place.description && (
                <p className="place-description">
                  {place.description}
                </p>
              )}

              {place.tags && place.tags.length > 0 && (
                <div className="place-tags">
                  {place.tags.map(tag => (
                    <span 
                      key={tag.id} 
                      className="tag"
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
        <div className="empty-state">
          <p className="empty-message">Ничего не найдено</p>
          <p className="empty-hint">Попробуйте изменить параметры поиска</p>
        </div>
      )}
    </div>
  );
}

export default Places;