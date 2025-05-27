import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import API from '../components/api';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import '../styles/Profile.css'; // или добавить стили в существующий CSS файл

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
    <div className="page-container">
      <div className="profile-header">
        <h1>{user.username}'s Профиль</h1>
        <p className="welcome-message">Добро пожаловать, {user.username}!</p>
      </div>

      <div className="email-section">
        <h3>Email:</h3>
        {editingEmail || !emailVerified ? (
          <form onSubmit={handleEmailSubmit} className="email-form">
            <input
              type="email"
              placeholder="Введите email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button type="submit" className="btn">Сохранить</button>
          </form>
        ) : (
          <div>
            <p>Email: {email}</p>
            <div className={`email-status ${emailVerified ? 'verified' : 'not-verified'}`}>
              {emailVerified ? '✅ Подтверждён' : '❗ Не подтверждён (Письмо отправлено)'}
            </div>
            <div className="email-actions">
              <button 
                onClick={() => setEditingEmail(true)} 
                className="btn-outline"
              >
                Изменить email
              </button>
            </div>
          </div>
        )}
        {message && (
          <div className={`message ${message.includes('успешно') ? 'success' : 'error'}`}>
            {message}
          </div>
        )}
      </div>

      <div className="favorites-section">
        <h3>Ваши избранные места:</h3>
        {favorites.length > 0 ? (
          <div className="favorites-grid">
            {favorites.map(place => (
              <div key={place.id} className="favorite-card">
                <Link to={`/places/${place.id}`} className="favorite-link">
                  {place.image && (
                    <img
                      src={`${API}/uploads/${place.image}`}
                      alt={place.title}
                      className="favorite-image"
                    />
                  )}
                  <div className="favorite-content">
                    <h4 className="favorite-title">{place.title}</h4>
                  </div>
                </Link>
                <button
                  onClick={() => removeFromFavorites(place.id)}
                  className="remove-favorite-btn"
                >
                  Удалить из избранного
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-favorites">
            <p>У вас пока нет избранных мест.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Profile;
