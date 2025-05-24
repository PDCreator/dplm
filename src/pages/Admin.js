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

  // === Места ===
  const [places, setPlaces] = useState([]);
  const [placeTitle, setPlaceTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [tags, setTags] = useState('');
  const [image, setImage] = useState('');
  const [placeMessage, setPlaceMessage] = useState('');
  const [editingPlaceId, setEditingPlaceId] = useState(null);

  const [latitude, setLatitude] = useState('');
const [longitude, setLongitude] = useState('');
const [images, setImages] = useState([]);

  useEffect(() => {
    if (user?.is_admin === 1) {
      fetchNews();
      fetchPlaces();
    }
  }, []);

  const fetchNews = async () => {
    const res = await fetch('http://localhost:5000/api/news');
    const data = await res.json();
    setNews(data);
  };

  const fetchPlaces = async () => {
    const res = await fetch('http://localhost:5000/api/places');
    const data = await res.json();
    setPlaces(data);
  };

  if (!user || user.is_admin !== 1) {
    return <div>Нет доступа</div>;
  }

  // === Отправка/редактирование новости ===
  const handleNewsSubmit = async (e) => {
    e.preventDefault();
    const url = editingId
      ? `http://localhost:5000/api/news/${editingId}`
      : 'http://localhost:5000/api/news';
    const method = editingId ? 'PUT' : 'POST';

    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content }),
    });

    const data = await response.json();
    if (response.ok) {
      setMessage(editingId ? 'Новость обновлена!' : 'Новость добавлена!');
      setTitle('');
      setContent('');
      setEditingId(null);
      fetchNews();
    } else {
      setMessage(data.message || 'Ошибка');
    }
  };

  // === Отправка/редактирование места ===
  const handlePlaceSubmit = async (e) => {
    e.preventDefault();
  
    const formData = new FormData();
    formData.append('title', placeTitle);
    formData.append('description', description);
    formData.append('tags', tags);
    formData.append('latitude', latitude);
    formData.append('longitude', longitude);
  
    images.forEach((file) => {
      formData.append('images', file); // `images` должен соответствовать backend
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
      setPlaceTitle('');
      setDescription('');
      setTags('');
      setLatitude('');
      setLongitude('');
      setImages([]);
      setEditingPlaceId(null);
      fetchPlaces();
    } else {
      setPlaceMessage(data.error || 'Ошибка');
    }
  };

  // === Удаление новости ===
  const handleDeleteNews = async (id) => {
    if (!window.confirm('Удалить эту новость?')) return;
    const res = await fetch(`http://localhost:5000/api/news/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setMessage('Новость удалена');
      fetchNews();
    }
  };

  // === Удаление места ===
  const handleDeletePlace = async (id) => {
    if (!window.confirm('Удалить это место?')) return;
    const res = await fetch(`http://localhost:5000/api/places/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setPlaceMessage('Место удалено');
      fetchPlaces();
    }
  };

  return (
    <div style={{ padding: '1rem' }}>
      <h2>Админ-панель</h2>

      {/* Переключение вкладок */}
      <div style={{ marginBottom: '1rem' }}>
        <button onClick={() => setActiveTab('news')} disabled={activeTab === 'news'}>
          Новости
        </button>{' '}
        <button onClick={() => setActiveTab('places')} disabled={activeTab === 'places'}>
          Места
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
            <button type="submit">{editingId ? 'Обновить' : 'Добавить'}</button>
          </form>

          <h3>Все новости</h3>
          {news.map((item) => (
            <div key={item.id} style={{ borderBottom: '1px solid #ccc', margin: '1rem 0' }}>
              <h4>{item.title}</h4>
              <p>{item.content}</p>
              <button onClick={() => {
                setTitle(item.title);
                setContent(item.content);
                setEditingId(item.id);
              }}>Редактировать</button>{' '}
              <button onClick={() => handleDeleteNews(item.id)}>Удалить</button>
            </div>
          ))}
        </>
      )}

      {/* === Места === */}
      {activeTab === 'places' && (
        <>
          <form onSubmit={handlePlaceSubmit} encType="multipart/form-data">
          <h3>{editingPlaceId ? 'Редактировать место' : 'Добавить место'}</h3>
          {placeMessage && <p>{placeMessage}</p>}

          <input
            type="text"
            placeholder="Название"
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
            rows={3}
            style={{ width: '100%', marginBottom: '0.5rem' }}
          />

          <input
            type="text"
            placeholder="Теги (через запятую)"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            style={{ width: '100%', marginBottom: '0.5rem' }}
          />

          <input
            type="number"
            placeholder="Широта (latitude)"
            value={latitude}
            onChange={(e) => setLatitude(e.target.value)}
            step="any"
            required
            style={{ width: '100%', marginBottom: '0.5rem' }}
          />

          <input
            type="number"
            placeholder="Долгота (longitude)"
            value={longitude}
            onChange={(e) => setLongitude(e.target.value)}
            step="any"
            required
            style={{ width: '100%', marginBottom: '0.5rem' }}
          />

          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => setImages([...e.target.files])}
            style={{ width: '100%', marginBottom: '0.5rem' }}
          />

          <button type="submit">{editingPlaceId ? 'Обновить' : 'Добавить'}</button>
        </form>

          <h3>Все места</h3>
          {places.map((p) => (
            <div key={p.id} style={{ borderBottom: '1px solid #ccc', margin: '1rem 0' }}>
                {p.image && (
                  <img
                    src={`http://localhost:5000${p.image}`}
                    alt={p.title}
                    style={{
                      width: '100%',
                      height: '150px',
                      objectFit: 'cover',
                      borderRadius: '6px',
                      marginTop: '0.5rem'
                    }}
                  />
                )}
              <h4>{p.title}</h4>
              <p>{p.description}</p>
              <p><strong>Теги:</strong> {p.tags}</p>
              {p.image && <img src={p.image} alt={p.title} style={{ maxWidth: '200px' }} />}
              <div style={{ marginTop: '0.5rem' }}>
                <button onClick={() => {
                  setPlaceTitle(p.title);
                  setDescription(p.description);
                  setLocation(p.location);
                  setTags(p.tags);
                  setImage(p.image);
                  setEditingPlaceId(p.id);
                }}>Редактировать</button>{' '}
                <button onClick={() => handleDeletePlace(p.id)}>Удалить</button>
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

export default Admin;
