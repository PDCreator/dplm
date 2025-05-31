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

  const [visitedPlaces, setVisitedPlaces] = useState([]);
  const [activeTab, setActiveTab] = useState('favorites');

  const [achievements, setAchievements] = useState([]);
  const [newAchievements, setNewAchievements] = useState([]);

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

  // Добавляем загрузку посещенных мест
  useEffect(() => {
    if (user && activeTab === 'visited') {
      fetch(`${API}/places/user/visited?user_id=${user.id}`)
        .then(res => res.json())
        .then(setVisitedPlaces);
    }
  }, [user, activeTab]);

  // Функция для удаления из посещенных
  const removeFromVisited = async (placeId) => {
    if (!user) return alert(t('profile.messages.loginRequired'));

    const res = await fetch(`${API}/places/${placeId}/visit?user_id=${user.id}`, {
      method: 'DELETE'
    });

    if (res.ok) {
      setVisitedPlaces(visitedPlaces.filter(place => place.id !== placeId));
    }
  };
  // Загружаем достижения
  useEffect(() => {
    if (user) {
      fetch(`${API}/achievements/user/${user.id}`)
        .then(res => res.json())
        .then(setAchievements);
    }
  }, [user]);
    // Проверяем новые достижения при изменениях
  useEffect(() => {
    if (visitedPlaces.length > 0 && user) {
      fetch(`${API}/achievements/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: user.id, 
          action: 'place_visited',
          data: { count: visitedPlaces.length }
        })
      })
      .then(res => res.json())
      .then(data => {
        if (data.newAchievements.length > 0) {
          setNewAchievements(data.newAchievements);
          // Перезагружаем достижения
          fetch(`${API}/achievements/user/${user.id}`)
            .then(res => res.json())
            .then(setAchievements);
        }
      });
    }
  }, [visitedPlaces.length, user]);
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
      <div className="profile-tabs">
        <button 
          onClick={() => setActiveTab('favorites')} 
          className={activeTab === 'favorites' ? 'active' : ''}
        >
          {t('profile.favorites')}
        </button>
        <button 
          onClick={() => setActiveTab('visited')} 
          className={activeTab === 'visited' ? 'active' : ''}
        >
          {t('profile.visited')}
        </button>
      </div>
      {activeTab === 'favorites' ? (
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
        </div>) : (
          <div className="visited-section">
          <h3>{t('profile.visited')}</h3>
          {visitedPlaces.length > 0 ? (
            <div className="visited-places-grid">
              {visitedPlaces.map(place => (
                <div key={place.id} className="visited-place-card">
                  <Link to={`/places/${place.id}`} className="visited-place-link">
                    <div className="visited-place-content">
                      <h4 className="visited-place-title">{place.title}</h4>
                    </div>
                  </Link>
                  <button
                    onClick={() => removeFromVisited(place.id)}
                    className="remove-visited-btn"
                  >
                    {t('profile.buttons.removeVisited')}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-places">
              <p>{t('profile.noVisited')}</p>
            </div>
          )}
        </div>
        )}
        <div className="achievements-section">
          <h3>{t('profile.achievements')}</h3>
          <div className="achievements-stats">
            <div className="stat-card">
              <span className="stat-value">{achievements.filter(a => a.unlocked).length}</span>
              <span className="stat-label">{t('profile.achievementsUnlocked')}</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">{achievements.length}</span>
              <span className="stat-label">{t('profile.totalAchievements')}</span>
            </div>
          </div>
          
          {newAchievements.length > 0 && (
            <div className="new-achievements-banner">
              {t('profile.newAchievementsUnlocked', { count: newAchievements.length })}
            </div>
          )}
          
          <div className="achievements-grid">
            {achievements.map(ach => (
              <div 
                key={ach.id} 
                className={`achievement-card ${ach.unlocked ? 'unlocked' : 'locked'}`}
              >
                <div className="achievement-icon">
                  {ach.unlocked ? (
                    <img src={`/icons/${ach.icon}`} alt={ach.name} />
                  ) : (
                    <div className="locked-icon">🔒</div>
                  )}
                </div>
                <div className="achievement-info">
                  <h4>{ach.name}</h4>
                  <p>{ach.description}</p>
                  {ach.unlocked && (
                    <div className="achievement-date">
                      {t('profile.unlockedOn')} {new Date(ach.unlocked_at).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
      </div>
    </div>
  );
}

export default Profile;