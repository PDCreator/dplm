import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { useTranslation } from 'react-i18next';
import API from '../components/api';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import '../styles/Profile.css';

function Profile() {
  const { t } = useTranslation( 'profile', 'common');
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
      fetch(`${API}/favorites/user/${user.id}`)
        .then(res => res.json())
        .then(setFavorites);

      fetch(`${API}/users/${user.id}`)
        .then(res => res.json())
        .then(data => {
          setEmail(data.email || '');
          setEmailVerified(data.email_verified);
        });
    }
  }, [user]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('verified') === '1') {
      setMessage(t('profile.messages.emailVerified'));
      setEmailVerified(true);
      navigate('/profile', { replace: true });
    }
  }, [location, navigate, t]);

  const removeFromFavorites = async (placeId) => {
    if (!user) return alert(t('profile.messages.loginRequired'));

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

  if (!user) return <div>{t('messages.loginRequired')}</div>;

  return (
    <div className="page-container">
      <div className="profile-header">
        <h1>{t('profile.title', { username: user.username })}</h1>
        <p className="welcome-message">
          {t('profile.welcome', { username: user.username })}
        </p>
      </div>

      <div className="email-section">
        <h3>{t('profile.email')}</h3>
        {editingEmail || !emailVerified ? (
          <form onSubmit={handleEmailSubmit} className="email-form">
            <input
              type="email"
              placeholder={t('profile.emailPlaceholder')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button type="submit" className="btn">
              {t('profile.buttons.save')}
            </button>
          </form>
        ) : (
          <div>
            <p>{t('profile.email')}: {email}</p>
            <div className={`email-status ${emailVerified ? 'verified' : 'not-verified'}`}>
              {emailVerified 
                ? t('profile.emailStatus.verified') 
                : t('profile.emailStatus.notVerified')}
            </div>
            <div className="email-actions">
              <button 
                onClick={() => setEditingEmail(true)} 
                className="btn-outline"
              >
                {t('profile.buttons.changeEmail')}
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
        <h3>{t('profile.favorites')}</h3>
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
                  {t('profile.buttons.removeFavorite')}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-favorites">
            <p>{t('profile.noFavorites')}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Profile;