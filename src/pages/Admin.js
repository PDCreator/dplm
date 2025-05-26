import { useEffect, useState } from 'react';
import { useAuth } from '../AuthContext';

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
    setAvailableTags(data);
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
    <div style={{ padding: '1rem' }}>
      <h2>Админ-панель</h2>

      {/* Вкладки */}
      <div style={{ marginBottom: '1rem' }}>
        <button onClick={() => setActiveTab('news')} disabled={activeTab === 'news'}>
          Новости
        </button>{' '}
        <button onClick={() => setActiveTab('places')} disabled={activeTab === 'places'}>
          Места
        </button>{' '}
        <button onClick={() => setActiveTab('users')} disabled={activeTab === 'users'}>
          Пользователи
        </button>
      </div>

      {/* === Новости === */}
      {activeTab === 'news' && (
        <>
          <form onSubmit={handleNewsSubmit}>
            <h3>{editingId ? 'Редактировать новость' : 'Добавить новость'}</h3>
            {message && <p>{message}</p>}
            <input
              type="text"
              placeholder="Заголовок"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              style={{ width: '100%', marginBottom: '0.5rem' }}
            />
            <textarea
              placeholder="Содержимое"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              rows={5}
              style={{ width: '100%', marginBottom: '0.5rem' }}
            />
            <div>
              <p>Привязать к местам:</p>
              {places.map((place) => (
                <label key={place.id} style={{ marginRight: 10 }}>
                  <input
                    type="checkbox"
                    checked={selectedPlaceIds.includes(place.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedPlaceIds([...selectedPlaceIds, place.id]);
                      } else {
                        setSelectedPlaceIds(selectedPlaceIds.filter(id => id !== place.id));
                      }
                    }}
                  />{' '}
                  {place.title}
                </label>
              ))}
            </div>
            <button type="submit" style={{ marginTop: 10 }}>
              {editingId ? 'Сохранить' : 'Добавить'}
            </button>{' '}
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
              >
                Отмена
              </button>
            )}
          </form>

          <h3>Список новостей</h3>
          <ul>
            {news.map((item) => (
              <li key={item.id} style={{ marginBottom: 10 }}>
                <b>{item.title}</b>{' '}
                <button onClick={() => handleEditNews(item)}>Редактировать</button>{' '}
                <button onClick={() => handleDeleteNews(item.id)}>Удалить</button>
                <p>{item.content}</p>
                {item.places?.length > 0 && (
                  <p>
                    Связанные места:{' '}
                    {item.places.map((p) => p.title).join(', ')}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </>
      )}

      {/* === Места === */}
      {activeTab === 'places' && (
        <>
          <form onSubmit={handlePlaceSubmit}>
            <h3>{editingPlaceId ? 'Редактировать место' : 'Добавить место'}</h3>
            {placeMessage && <p>{placeMessage}</p>}
            <input
              type="text"
              placeholder="Название места"
              value={placeTitle}
              onChange={(e) => setPlaceTitle(e.target.value)}
              required
              style={{ width: '100%', marginBottom: '0.5rem' }}
            />
            <textarea
              placeholder="Описание"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={4}
              style={{ width: '100%', marginBottom: '0.5rem' }}
            />

            <div style={{ marginBottom: '0.5rem', position: 'relative' }}>
              <label>Теги:</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', margin: '0.5rem 0' }}>
                {selectedTags.map(tag => (
                  <span 
                    key={tag.id} 
                    style={{
                      background: '#eee',
                      padding: '0.2rem 0.5rem',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center'
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
              
              <input
                type="text"
                placeholder="Добавить теги (начните вводить)"
                value={tagsInput}
                onChange={handleTagsInputChange}
                onFocus={() => tagsInput.length > 0 && setShowTagDropdown(true)}
                style={{ width: '100%' }}
              />
              
              {showTagDropdown && (
                <ul style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  background: 'white',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  maxHeight: '200px',
                  overflowY: 'auto',
                  zIndex: 1000,
                  margin: 0,
                  padding: 0,
                  listStyle: 'none'
                }}>
                  {filteredTags.map(tag => (
                    <li 
                      key={tag.id}
                      onClick={() => handleTagSelect(tag)}
                      style={{
                        padding: '0.5rem',
                        cursor: 'pointer',
                        borderBottom: '1px solid #eee'
                      }}
                    >
                      {tag.name}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div style={{ marginBottom: '0.5rem' }}>
              <label>Добавить новый тег:</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  placeholder="Название нового тега"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  style={{ flex: 1 }}
                />
                <button 
                  type="button" 
                  onClick={handleAddNewTag}
                  disabled={!newTagName.trim()}
                >
                  Добавить
                </button>
              </div>
            </div>

            <input
              type="text"
              placeholder="Широта"
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
              style={{ width: '49%', marginRight: '2%', marginBottom: '0.5rem' }}
            />
            <input
              type="text"
              placeholder="Долгота"
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
              style={{ width: '49%', marginBottom: '0.5rem' }}
            />

            <div>
              <p>Загрузить изображения (можно несколько):</p>
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
              />
            </div>

            {/* Показать существующие изображения (если редактируем) */}
            {existingImages.length > 0 && (
              <div style={{ marginTop: '0.5rem' }}>
                <p>Существующие изображения:</p>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {existingImages.map((imgUrl, i) => (
                    <div key={i} style={{ position: 'relative' }}>
                      <img
                        src={`http://localhost:5000/${imgUrl}`}
                        alt="img"
                        style={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 4 }}
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveExistingImage(imgUrl)}
                        style={{
                          position: 'absolute',
                          top: 0,
                          right: 0,
                          background: 'rgba(255,0,0,0.7)',
                          border: 'none',
                          color: 'white',
                          borderRadius: '50%',
                          width: 20,
                          height: 20,
                          cursor: 'pointer',
                        }}
                        title="Удалить изображение"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {images.length > 0 && (
              <div style={{ marginTop: '0.5rem' }}>
                <p>Выбранные для загрузки изображения:</p>
                <ul>
                  {images.map((file, i) => (
                    <li key={i}>{file.name}</li>
                  ))}
                </ul>
              </div>
            )}

            <button type="submit" style={{ marginTop: 10 }}>
              {editingPlaceId ? 'Сохранить' : 'Добавить'}
            </button>{' '}
            {editingPlaceId && (
              <button type="button" onClick={resetPlaceForm}>
                Отмена
              </button>
            )}
          </form>

          <h3>Список мест</h3>
          <ul>
            {places.map((p) => (
              <li key={p.id} style={{ marginBottom: 15 }}>
                <b>{p.title}</b> — Теги: {selectedTags.filter(t => p.tagIds?.includes(t.id)).map(t => t.name).join(', ')} — Координаты: {p.latitude}, {p.longitude}{' '}
                <button onClick={() => handleEditPlace(p)}>Редактировать</button>{' '}
                <button onClick={() => handleDeletePlace(p.id)}>Удалить</button>
                <p>{p.description}</p>
                {/* Показываем миниатюры */}
                <div style={{ display: 'flex', gap: 10 }}>
                  {p.images?.map((imgUrl, i) => (
                    <img
                      key={i}
                      src={`http://localhost:5000/${imgUrl}`}
                      alt="img"
                      style={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 4 }}
                    />
                  ))}
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      {/* === Пользователи === */}
      {activeTab === 'users' && (
        <>
          <h3>Пользователи</h3>
          <input
            type="text"
            placeholder="Поиск по логину"
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
            style={{ marginBottom: '1rem', width: '50%' }}
          />
          <ul>
            {filteredUsers.map((u) => (
              <li key={u.id} style={{ marginBottom: 10 }}>
                <b>{u.login}</b> — Email: {u.email} — Admin: {u.is_admin ? 'Да' : 'Нет'}{' '}
                <button onClick={() => setEditingUser({ ...u })}>Редактировать</button>{' '}
                <button onClick={() => handleDeleteUser(u.id)}>Удалить</button>
              </li>
            ))}
          </ul>

          {editingUser && (
            <form onSubmit={handleUpdateUser} style={{ marginTop: '1rem' }}>
              <h3>Редактировать пользователя</h3>
              <input
                type="text"
                value={editingUser.login}
                onChange={(e) =>
                  setEditingUser((prev) => ({ ...prev, login: e.target.value }))
                }
                required
                placeholder="Логин"
                style={{ marginBottom: '0.5rem', width: '100%' }}
              />
              <input
                type="email"
                value={editingUser.email}
                onChange={(e) =>
                  setEditingUser((prev) => ({ ...prev, email: e.target.value }))
                }
                placeholder="Email"
                style={{ marginBottom: '0.5rem', width: '100%' }}
              />
              <label>
                <input
                  type="checkbox"
                  checked={editingUser.is_admin === 1 || editingUser.is_admin === true}
                  onChange={(e) =>
                    setEditingUser((prev) => ({
                      ...prev,
                      is_admin: e.target.checked ? 1 : 0,
                    }))
                  }
                />{' '}
                Администратор
              </label>
              <br />
              <button type="submit" style={{ marginTop: 10 }}>
                Сохранить
              </button>{' '}
              <button type="button" onClick={() => setEditingUser(null)}>
                Отмена
              </button>
            </form>
          )}
        </>
      )}
    </div>
  );
}

export default Admin;