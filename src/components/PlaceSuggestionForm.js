// src/components/PlaceSuggestionForm.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import API from './api';
import '../styles/Admin.css'; // Используем стили из админки

function PlaceSuggestionForm({ onClose }) {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [availableTags, setAvailableTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [filteredTags, setFilteredTags] = useState([]);
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  const [images, setImages] = useState([]);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetch(`${API}/places/tags?include_cities=true`)
      .then(res => res.json())
      .then(data => setAvailableTags(data.sort((a, b) => a.name.localeCompare(b.name))))
      .catch(console.error);
  }, []);

  const handleTagsInputChange = (e) => {
    const value = e.target.value;
    setTagsInput(value);
    
    if (value.length > 0) {
      const filtered = availableTags.filter(tag => 
        tag.name.toLowerCase().includes(value.toLowerCase()) &&
        !selectedTags.some(t => t.id === tag.id)
      );
      setFilteredTags(filtered);
      setShowTagDropdown(filtered.length > 0);
    } else {
      setFilteredTags([]);
      setShowTagDropdown(false);
    }
  };

  const handleTagSelect = (tag) => {
    if (!selectedTags.some(t => t.id === tag.id)) {
      setSelectedTags([...selectedTags, tag]);
    }
    setTagsInput('');
    setShowTagDropdown(false);
  };

  const handleTagRemove = (tagId) => {
    setSelectedTags(selectedTags.filter(tag => tag.id !== tagId));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData();
    formData.append('user_id', user.id);
    formData.append('title', title);
    formData.append('description', description);
    formData.append('latitude', latitude);
    formData.append('longitude', longitude);
    formData.append('tagIds', JSON.stringify(selectedTags.map(tag => tag.id)));

    images.forEach((file) => {
      formData.append('images', file);
    });

    try {
      const res = await fetch(`${API}/places/suggestions`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        setMessage('Ваше предложение отправлено на модерацию. Вы получите уведомление по email о результате.');
        setTimeout(() => {
          onClose();
        }, 3000);
      } else {
        setMessage(data.error || 'Ошибка при отправке предложения');
      }
    } catch (err) {
      console.error('Error submitting suggestion:', err);
      setMessage('Ошибка при отправке предложения');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="admin-container">
      <div className="admin-card">
        <h2 className="admin-title">Предложить новое место</h2>
        
        {message && (
          <p className={`admin-message ${message.includes('отправлено') ? 'success' : 'error'}`}>
            {message}
          </p>
        )}
        
        <form onSubmit={handleSubmit} className="admin-form">
          <div className="form-group">
            <input
              type="text"
              placeholder="Название места"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="admin-input"
            />
          </div>

          <div className="form-group">
            <textarea
              placeholder="Описание"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              required
              className="admin-textarea"
            />
          </div>

          {/* Теги - стилизованные как в админке */}
          <div className="admin-tags-container">
            <label>Теги:</label>
            <div className="admin-tags-selected">
              {selectedTags.map(tag => (
                <span key={tag.id} className="admin-tag">
                  {tag.name}
                  <button 
                    type="button" 
                    onClick={() => handleTagRemove(tag.id)}
                    className="admin-tag-remove"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            
            <input
              type="text"
              placeholder="Добавить теги (начните вводить)"
              value={tagsInput}
              onChange={handleTagsInputChange}
              onFocus={() => {
                const filtered = availableTags.filter(tag => 
                  !selectedTags.some(t => t.id === tag.id)
                );
                setFilteredTags(filtered);
                setShowTagDropdown(filtered.length > 0);
              }}
              className="admin-input"
            />
            
            {showTagDropdown && (
              <ul className="admin-tags-dropdown">
                {filteredTags.map(tag => (
                  <li 
                    key={tag.id}
                    onClick={() => handleTagSelect(tag)}
                    className="admin-tags-dropdown-item"
                  >
                    {tag.name}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Координаты */}
          <div className="admin-coords">
            <input
              type="text"
              placeholder="Широта"
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
              className="admin-input half"
            />
            <input
              type="text"
              placeholder="Долгота"
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
              className="admin-input half"
            />
          </div>

          {/* Изображения */}
          <div className="admin-images">
            <label>Загрузить изображения (можно несколько):</label>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => setImages(Array.from(e.target.files))}
              className="admin-file-input"
            />
            {images.length > 0 && (
              <div className="admin-selected-images">
                <p>Выбранные для загрузки изображения:</p>
                <ul className="admin-images-list">
                  {images.map((file, i) => (
                    <li key={i}>{file.name}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="admin-form-actions">
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="admin-button primary"
            >
              {isSubmitting ? 'Отправка...' : 'Отправить на модерацию'}
            </button>
            <button 
              type="button" 
              onClick={onClose}
              className="admin-button"
            >
              Отмена
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default PlaceSuggestionForm;