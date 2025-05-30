// src/components/PlaceSuggestionForm.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import API from './api';
import '../styles/PlaceSuggestionForm.css';

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
    fetch(`${API}/places/tags?include_cities=false`)
      .then(res => res.json())
      .then(setAvailableTags)
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
    <div className="suggestion-form-container">
      <h2>Предложить новое место</h2>
      {message && <p className={`message ${message.includes('отправлено') ? 'success' : 'error'}`}>{message}</p>}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Название места:</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label>Описание:</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            required
          />
        </div>

        <div className="form-group">
          <label>Теги:</label>
          <div className="tags-selected">
            {selectedTags.map(tag => (
              <span key={tag.id} className="tag">
                {tag.name}
                <button 
                  type="button" 
                  onClick={() => handleTagRemove(tag.id)}
                  className="tag-remove"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          
          <input
            type="text"
            placeholder="Добавить теги"
            value={tagsInput}
            onChange={handleTagsInputChange}
            onFocus={() => {
              const filtered = availableTags.filter(tag => !selectedTags.some(t => t.id === tag.id));
              setFilteredTags(filtered);
              setShowTagDropdown(filtered.length > 0);
            }}
          />
          
          {showTagDropdown && (
            <ul className="tags-dropdown">
              {filteredTags.map(tag => (
                <li 
                  key={tag.id}
                  onClick={() => handleTagSelect(tag)}
                >
                  {tag.name}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="form-group coords">
          <div>
            <label>Широта:</label>
            <input
              type="text"
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
            />
          </div>
          <div>
            <label>Долгота:</label>
            <input
              type="text"
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
            />
          </div>
        </div>

        <div className="form-group">
          <label>Изображения:</label>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => setImages(Array.from(e.target.files))}
          />
          {images.length > 0 && (
            <div className="selected-images">
              Выбрано файлов: {images.length}
            </div>
          )}
        </div>

        <div className="form-actions">
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Отправка...' : 'Отправить на модерацию'}
          </button>
          <button type="button" onClick={onClose}>Отмена</button>
        </div>
      </form>
    </div>
  );
}

export default PlaceSuggestionForm;