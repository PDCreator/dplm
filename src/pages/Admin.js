import { useEffect, useState } from 'react';
import { useAuth } from '../AuthContext';
import '../styles/Admin.css'; // Создай этот файл

function Admin() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('news');

  // === Новости ===
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [news, setNews] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState('');
  const [selectedPlaceIds, setSelectedPlaceIds] = useState([]);
  const [placesInput, setPlacesInput] = useState('');
  const [filteredPlaces, setFilteredPlaces] = useState([]);
  const [showPlacesDropdown, setShowPlacesDropdown] = useState(false);

  // === Места ===
  const [places, setPlaces] = useState([]);
  const [placeTitle, setPlaceTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [availableTags, setAvailableTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [filteredTags, setFilteredTags] = useState([]);
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [images, setImages] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [placeMessage, setPlaceMessage] = useState('');
  const [editingPlaceId, setEditingPlaceId] = useState(null);
  const [tagToDelete, setTagToDelete] = useState('');
  const [isDeletingTag, setIsDeletingTag] = useState(false);


  // === Пользователи ===
  const [users, setUsers] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [editingUser, setEditingUser] = useState(null);

  useEffect(() => {
    if (user?.is_admin === 1) {
      fetchNews();
      fetchPlaces();
      fetchUsers();
      fetchTags();
    }
  }, [user]);

  // Загрузка новостей
  const fetchNews = async () => {
    const res = await fetch('http://localhost:5000/api/news');
    const data = await res.json();
    setNews(data);
  };

  // Загрузка мест
  const fetchPlaces = async () => {
    const res = await fetch('http://localhost:5000/api/places');
    const data = await res.json();
    setPlaces(data);
  };

  // Загрузка пользователей
  const fetchUsers = async () => {
    const res = await fetch('http://localhost:5000/api/users');
    const data = await res.json();
    setUsers(data);
  };

  // Загрузка тегов
  const fetchTags = async () => {
    const res = await fetch('http://localhost:5000/api/places/tags');
    const data = await res.json();
    // Сортируем теги по имени для удобства выбора
    setAvailableTags(data.sort((a, b) => a.name.localeCompare(b.name)));
  };

  // Фильтр пользователей по логину
  const filteredUsers = users.filter(u =>
    u.login.toLowerCase().includes(userSearch.toLowerCase())
  );

  if (!user || user.is_admin !== 1) {
    return <div>Нет доступа</div>;
  }

  // === Обработка тегов ===
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

  const handleAddNewTag = async () => {
    if (!newTagName.trim()) return;
    
    try {
      const res = await fetch('http://localhost:5000/api/places/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newTagName.trim() })
      });
      
      if (res.ok) {
        const data = await res.json();
        setAvailableTags([...availableTags, data]);
        setSelectedTags([...selectedTags, data]);
        setNewTagName('');
      } else {
        setPlaceMessage('Ошибка при добавлении тега');
      }
    } catch (err) {
      console.error('Error adding tag:', err);
      setPlaceMessage('Ошибка при добавлении тега');
    }
  };
  // Обработчик удаления тега
  const handleDeleteTag = async () => {
    if (!tagToDelete || !window.confirm('Удалить этот тег? Это также удалит все его связи с местами.')) return;
    
    setIsDeletingTag(true);
    try {
      const res = await fetch(`http://localhost:5000/api/places/tags/${tagToDelete}`, {
        method: 'DELETE'
      });
      
      if (res.ok) {
        // Обновляем список тегов
        await fetchTags();
        setTagToDelete('');
        setPlaceMessage('Тег успешно удален');
      } else {
        const data = await res.json();
        setPlaceMessage(data.error || 'Ошибка при удалении тега');
      }
    } catch (err) {
      console.error('Error deleting tag:', err);
      setPlaceMessage('Ошибка при удалении тега');
    } finally {
      setIsDeletingTag(false);
    }
  };

  // === Новости ===
  const handleNewsSubmit = async (e) => {
    e.preventDefault();
    const url = editingId
      ? `http://localhost:5000/api/news/${editingId}`
      : 'http://localhost:5000/api/news';
    const method = editingId ? 'PUT' : 'POST';

    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content, placeIds: selectedPlaceIds }),
    });

    const data = await response.json();
    if (response.ok) {
      setMessage(editingId ? 'Новость обновлена!' : 'Новость добавлена!');
      setTitle('');
      setContent('');
      setSelectedPlaceIds([]);
      setEditingId(null);
      fetchNews();
    } else {
      setMessage(data.message || 'Ошибка');
    }
  };

  const handleEditNews = (item) => {
    setTitle(item.title);
    setContent(item.content);
    setEditingId(item.id);
    setSelectedPlaceIds(item.places ? item.places.map(p => p.id) : []);
  };

  const handleDeleteNews = async (id) => {
    if (!window.confirm('Удалить эту новость?')) return;
    const res = await fetch(`http://localhost:5000/api/news/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setMessage('Новость удалена');
      fetchNews();
    }
  };

  // === Места ===
  const handlePlaceSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append('title', placeTitle);
    formData.append('description', description);
    formData.append('latitude', latitude);
    formData.append('longitude', longitude);
    formData.append('tagIds', JSON.stringify(selectedTags.map(tag => tag.id)));

    images.forEach((file) => {
      formData.append('images', file);
    });

    const url = editingPlaceId
      ? `http://localhost:5000/api/places/${editingPlaceId}`
      : 'http://localhost:5000/api/places';
    const method = editingPlaceId ? 'PUT' : 'POST';

    const response = await fetch(url, {
      method,
      body: formData,
    });

    const data = await response.json();
    if (response.ok) {
      setPlaceMessage(editingPlaceId ? 'Место обновлено!' : 'Место добавлено!');
      resetPlaceForm();
      fetchPlaces();
    } else {
      setPlaceMessage(data.error || 'Ошибка');
    }
  };

  const resetPlaceForm = () => {
    setPlaceTitle('');
    setDescription('');
    setTagsInput('');
    setSelectedTags([]);
    setNewTagName('');
    setLatitude('');
    setLongitude('');
    setImages([]);
    setExistingImages([]);
    setEditingPlaceId(null);
  };

  // При редактировании места подгружаем данные
  const handleEditPlace = async (p) => {
    setPlaceTitle(p.title);
    setDescription(p.description);
    setLatitude(p.latitude || '');
    setLongitude(p.longitude || '');
    setExistingImages(p.images || []);
    setImages([]);
    setEditingPlaceId(p.id);
    
    // Загружаем теги для редактируемого места
    try {
      const res = await fetch(`http://localhost:5000/api/places/${p.id}`);
      const data = await res.json();
      
      if (data.tagIds) {
        const tags = availableTags.filter(tag => 
          data.tagIds.includes(tag.id)
        );
        setSelectedTags(tags);
      }
    } catch (err) {
      console.error('Error loading place tags:', err);
    }
  };

  const handleDeletePlace = async (id) => {
    if (!window.confirm('Удалить это место?')) return;
    const res = await fetch(`http://localhost:5000/api/places/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setPlaceMessage('Место удалено');
      fetchPlaces();
    }
  };

  // Удалить отдельное существующее изображение при редактировании места
  const handleRemoveExistingImage = (urlToRemove) => {
    setExistingImages((prev) => prev.filter(img => img !== urlToRemove));
  };

  // === Пользователи ===
  const handleUpdateUser = async (e) => {
    e.preventDefault();
    const res = await fetch(`http://localhost:5000/api/users/${editingUser.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editingUser),
    });

    if (res.ok) {
      fetchUsers();
      setEditingUser(null);
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Удалить пользователя?')) return;
    const res = await fetch(`http://localhost:5000/api/users/${id}`, {
      method: 'DELETE',
    });

    if (res.ok) {
      fetchUsers();
    }
  };

return (
  <div className="admin-container">
    <div className="admin-card">
      <h2 className="admin-title">Админ-панель</h2>

      {/* Вкладки */}
      <div className="admin-tabs">
        <button 
          onClick={() => setActiveTab('news')} 
          className={`admin-tab ${activeTab === 'news' ? 'active' : ''}`}
        >
          Новости
        </button>
        <button 
          onClick={() => setActiveTab('places')} 
          className={`admin-tab ${activeTab === 'places' ? 'active' : ''}`}
        >
          Места
        </button>
        <button 
          onClick={() => setActiveTab('users')} 
          className={`admin-tab ${activeTab === 'users' ? 'active' : ''}`}
        >
          Пользователи
        </button>
      </div>

      {/* === Новости === */}
      {activeTab === 'news' && (
        <div className="admin-section">
          <form onSubmit={handleNewsSubmit} className="admin-form">
            <h3 className="admin-subtitle">
              {editingId ? 'Редактировать новость' : 'Добавить новость'}
            </h3>
            {message && <p className={`admin-message ${message.includes('!') ? 'success' : 'error'}`}>{message}</p>}
            
            <input
              type="text"
              placeholder="Заголовок"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="admin-input"
            />
            
            <textarea
              placeholder="Содержимое"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              rows={5}
              className="admin-textarea"
            />
            
            <div className="admin-tags-container">
              <label>Привязать к местам:</label>
              <div className="admin-tags-selected">
                {selectedPlaceIds.map(placeId => {
                  const place = places.find(p => p.id === placeId);
                  return place ? (
                    <span key={place.id} className="admin-tag">
                      {place.title}
                      <button 
                        type="button" 
                        onClick={() => setSelectedPlaceIds(selectedPlaceIds.filter(id => id !== place.id))}
                        className="admin-tag-remove"
                      >
                        ×
                      </button>
                    </span>
                  ) : null;
                })}
              </div>
              
              <input
                type="text"
                placeholder="Добавить места (начните вводить)"
                value={placesInput}
                onChange={(e) => {
                  setPlacesInput(e.target.value);
                  if (e.target.value.length > 0) {
                    const filtered = places.filter(place => 
                      place.title.toLowerCase().includes(e.target.value.toLowerCase()) &&
                      !selectedPlaceIds.includes(place.id)
                    );
                    setFilteredPlaces(filtered);
                    setShowPlacesDropdown(true);
                  } else {
                    setFilteredPlaces([]);
                    setShowPlacesDropdown(false);
                  }
                }}
                onFocus={() => {
                  setFilteredPlaces(places.filter(place => !selectedPlaceIds.includes(place.id)));
                  setShowPlacesDropdown(true);
                }}
                className="admin-input"
              />
              
              {showPlacesDropdown && (
                <ul className="admin-tags-dropdown">
                  {filteredPlaces.map(place => (
                    <li 
                      key={place.id}
                      onClick={() => {
                        setSelectedPlaceIds([...selectedPlaceIds, place.id]);
                        setPlacesInput('');
                        setShowPlacesDropdown(false);
                      }}
                      className="admin-tags-dropdown-item"
                    >
                      {place.title}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            
            <div className="admin-form-actions">
              <button type="submit" className="admin-button primary">
                {editingId ? 'Сохранить' : 'Добавить'}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(null);
                    setTitle('');
                    setContent('');
                    setSelectedPlaceIds([]);
                    setMessage('');
                  }}
                  className="admin-button"
                >
                  Отмена
                </button>
              )}
            </div>
          </form>

          <h3 className="admin-subtitle">Список новостей</h3>
          <div className="admin-list">
            {news.map((item) => (
              <div key={item.id} className="admin-list-item">
                <div className="admin-list-item-header">
                  <h4>{item.title}</h4>
                  <div className="admin-list-item-actions">
                    <button 
                      onClick={() => handleEditNews(item)} 
                      className="admin-button small"
                    >
                      Редактировать
                    </button>
                    <button 
                      onClick={() => handleDeleteNews(item.id)} 
                      className="admin-button small danger"
                    >
                      Удалить
                    </button>
                  </div>
                </div>
                <p className="admin-list-item-content">{item.content}</p>
                {item.places?.length > 0 && (
                  <p className="admin-list-item-places">
                    <strong>Связанные места:</strong>{' '}
                    {item.places.map((p) => p.title).join(', ')}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* === Места === */}
      {activeTab === 'places' && (
        <div className="admin-section">
          {/* Новый тег */}
          <div className="admin-new-tag">
            <label>Управление тегами:</label>
            <div className="admin-tags-management">
              {/* Добавление нового тега */}
              <div className="admin-new-tag-input">
                <input
                  type="text"
                  placeholder="Название нового тега"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  className="admin-input"
                />
                <button 
                  type="button" 
                  onClick={handleAddNewTag}
                  disabled={!newTagName.trim()}
                  className="admin-button small"
                >
                  Добавить
                </button>
              </div>

              {/* Удаление существующего тега */}
              <div className="admin-delete-tag">
                <select
                  value={tagToDelete}
                  onChange={(e) => setTagToDelete(e.target.value)}
                  className="admin-select"
                >
                  <option value="">Выберите тег для удаления</option>
                  {availableTags.map(tag => (
                    <option key={tag.id} value={tag.id}>
                      {tag.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleDeleteTag}
                  disabled={!tagToDelete}
                  className="admin-button small danger"
                >
                  Удалить
                </button>
              </div>
            </div>
          </div>
          <form onSubmit={handlePlaceSubmit} className="admin-form">
            <h3 className="admin-subtitle">
              {editingPlaceId ? 'Редактировать место' : 'Добавить место'}
            </h3>
            {placeMessage && <p className={`admin-message ${placeMessage.includes('!') ? 'success' : 'error'}`}>{placeMessage}</p>}
            
            <input
              type="text"
              placeholder="Название места"
              value={placeTitle}
              onChange={(e) => setPlaceTitle(e.target.value)}
              required
              className="admin-input"
            />
            
            <textarea
              placeholder="Описание"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={4}
              className="admin-textarea"
            />

            {/* Теги */}
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
                onChange={(e) => {
                  const files = e.target.files;
                  if (files.length) {
                    setImages(Array.from(files));
                  }
                }}
                className="admin-file-input"
              />
            </div>

            {/* Существующие изображения */}
            {existingImages.length > 0 && (
              <div className="admin-existing-images">
                <p>Существующие изображения:</p>
                <div className="admin-images-grid">
                  {existingImages.map((imgUrl, i) => (
                    <div key={i} className="admin-image-item">
                      <img
                        src={`http://localhost:5000/${imgUrl}`}
                        alt="img"
                        className="admin-image"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveExistingImage(imgUrl)}
                        className="admin-image-remove"
                        title="Удалить изображение"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Выбранные для загрузки изображения */}
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

            <div className="admin-form-actions">
              <button type="submit" className="admin-button primary">
                {editingPlaceId ? 'Сохранить' : 'Добавить'}
              </button>
              {editingPlaceId && (
                <button 
                  type="button" 
                  onClick={resetPlaceForm}
                  className="admin-button"
                >
                  Отмена
                </button>
              )}
            </div>
          </form>

          <h3 className="admin-subtitle">Список мест</h3>
          <div className="admin-list">
            {places.map((p) => (
              <div key={p.id} className="admin-list-item">
                <div className="admin-list-item-header">
                  <h4>{p.title}</h4>
                  <div className="admin-list-item-actions">
                    <button 
                      onClick={() => handleEditPlace(p)} 
                      className="admin-button small"
                    >
                      Редактировать
                    </button>
                    <button 
                      onClick={() => handleDeletePlace(p.id)} 
                      className="admin-button small danger"
                    >
                      Удалить
                    </button>
                  </div>
                </div>
                <p className="admin-list-item-content">
                  <strong>Описание:</strong> {p.description}
                </p>
                <p className="admin-list-item-meta">
                  <strong>Теги:</strong> {selectedTags.filter(t => p.tagIds?.includes(t.id)).map(t => t.name).join(', ')}
                </p>
                <p className="admin-list-item-meta">
                  <strong>Координаты:</strong> {p.latitude}, {p.longitude}
                </p>
                {p.images?.length > 0 && (
                  <div className="admin-list-item-images">
                    <strong>Изображения:</strong>
                    <div className="admin-images-grid">
                      {p.images.map((imgUrl, i) => (
                        <img
                          key={i}
                          src={`http://localhost:5000/${imgUrl}`}
                          alt="img"
                          className="admin-image"
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* === Пользователи === */}
      {activeTab === 'users' && (
        <div className="admin-section">
          <h3 className="admin-subtitle">Пользователи</h3>
          <input
            type="text"
            placeholder="Поиск по логину"
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
            className="admin-input search"
          />
          
          <div className="admin-list">
            {filteredUsers.map((u) => (
              <div key={u.id} className="admin-list-item">
                <div className="admin-list-item-header">
                  <h4>
                    {u.login} <span className="admin-user-email">({u.email})</span>
                  </h4>
                  <div className="admin-list-item-actions">
                    <button 
                      onClick={() => setEditingUser({ ...u })} 
                      className="admin-button small"
                    >
                      Редактировать
                    </button>
                    <button 
                      onClick={() => handleDeleteUser(u.id)} 
                      className="admin-button small danger"
                    >
                      Удалить
                    </button>
                  </div>
                </div>
                <p className="admin-list-item-meta">
                  <strong>Статус:</strong> {u.is_admin ? 'Администратор' : 'Пользователь'}
                </p>
              </div>
            ))}
          </div>

          {editingUser && (
            <form onSubmit={handleUpdateUser} className="admin-form">
              <h3 className="admin-subtitle">Редактировать пользователя</h3>
              <input
                type="text"
                value={editingUser.login}
                onChange={(e) =>
                  setEditingUser((prev) => ({ ...prev, login: e.target.value }))
                }
                required
                placeholder="Логин"
                className="admin-input"
              />
              <input
                type="email"
                value={editingUser.email}
                onChange={(e) =>
                  setEditingUser((prev) => ({ ...prev, email: e.target.value }))
                }
                placeholder="Email"
                className="admin-input"
              />
              <label className="admin-checkbox-label">
                <input
                  type="checkbox"
                  checked={editingUser.is_admin === 1 || editingUser.is_admin === true}
                  onChange={(e) =>
                    setEditingUser((prev) => ({
                      ...prev,
                      is_admin: e.target.checked ? 1 : 0,
                    }))
                  }
                  className="admin-checkbox"
                />{' '}
                Администратор
              </label>
              
              <div className="admin-form-actions">
                <button type="submit" className="admin-button primary">
                  Сохранить
                </button>
                <button 
                  type="button" 
                  onClick={() => setEditingUser(null)}
                  className="admin-button"
                >
                  Отмена
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  </div>
);
}

export default Admin;