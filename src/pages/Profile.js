import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import API from '../components/api';
import { Link, useNavigate, useLocation } from 'react-router-dom';

function Profile() {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState([]);
  const [email, setEmail] = useState('');
  const [emailVerified, setEmailVerified] = useState(false);
  const [message, setMessage] = useState('');
  const [editingEmail, setEditingEmail] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (user) {
      // Получить избранное
      fetch(`${API}/favorites/user/${user.id}`)
        .then(res => res.json())
        .then(setFavorites);

      // Получить email и статус
      fetch(`${API}/users/${user.id}`)
        .then(res => res.json())
        .then(data => {
          setEmail(data.email || '');
          setEmailVerified(data.email_verified);
        });
    }
  }, [user]);

  // Обработка запроса с флага ?verified=1
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('verified') === '1') {
      setMessage('Email успешно подтверждён!');
      setEmailVerified(true);
      // Удаляем параметр из URL
      navigate('/profile', { replace: true });
    }
  }, [location, navigate]);

  const removeFromFavorites = async (placeId) => {
    if (!user) return alert('Войдите, чтобы удалить место из избранного');

    const res = await fetch(`${API}/favorites/${placeId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: user.id }),
    });

    if (res.ok) {
      setFavorites(favorites.filter(place => place.id !== placeId));
    }
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    const res = await fetch(`${API}/auth/set-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: user.id, email }),
    });
    const data = await res.json();
    setMessage(data.message);
    setEditingEmail(false);
  };

  if (!user) return <div>Для доступа к профилю, пожалуйста, войдите.</div>;

  return (
    <div style={{ padding: '1rem' }}>
      <h2>{user.username}'s Профиль</h2>
      <p>Добро пожаловать, {user.username}!</p>

      <h3>Email:</h3>
      {editingEmail || !emailVerified ? (
        <form onSubmit={handleEmailSubmit} style={{ marginBottom: '1rem' }}>
          <input
            type="email"
            placeholder="Введите email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button type="submit" style={{ marginLeft: '0.5rem' }}>Сохранить</button>
        </form>
      ) : (
        <div style={{ marginBottom: '1rem' }}>
          <p>Email: {email}</p>
          <p>Статус: ✅ Подтверждён</p>
          <button onClick={() => setEditingEmail(true)}>Изменить email</button>
        </div>
      )}

      {!emailVerified && email && (
        <p>Статус: ❗ Не подтверждён (Письмо отправлено)</p>
      )}
      {message && <p style={{ color: 'green' }}>{message}</p>}

      <h3>Ваши избранные места:</h3>
      {favorites.length > 0 ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: '1rem'
        }}>
          {favorites.map(place => (
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
                  src={`${API}/uploads/${place.image}`}
                  alt={place.title}
                  style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '6px' }}
                />
              )}
              <button
                onClick={() => removeFromFavorites(place.id)}
                style={{ marginTop: '0.5rem' }}
              >
                Удалить из избранного
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p>У вас пока нет избранных мест.</p>
      )}
    </div>
  );
}

export default Profile;
