import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { useTranslation } from 'react-i18next';
import API from '../components/api';
import '../styles/PlaceDetail.css';

function PlaceDetail() {
  const { t } = useTranslation( 'placeNewsDetail');
  const { id } = useParams();
  const { user } = useAuth();

  const [place, setPlace] = useState(null);
  const [likeCount, setLikeCount] = useState(0);
  const [likedByUser, setLikedByUser] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [isFavorited, setIsFavorited] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
  if (!place || !place.latitude || !place.longitude) return;

  let map;
  let placemark;
  let checkInterval;

  const initMap = () => {
    try {
      window.ymaps.ready(() => {
        // Удаляем предыдущую карту, если есть
        const existingMap = document.getElementById('map');
        if (existingMap && existingMap._yandexMap) {
          existingMap._yandexMap.destroy();
        }

        map = new window.ymaps.Map('map', {
          center: [parseFloat(place.latitude), parseFloat(place.longitude)],
          zoom: 14,
        });

        placemark = new window.ymaps.Placemark(
          [parseFloat(place.latitude), parseFloat(place.longitude)],
          { balloonContent: place.title },
          { preset: 'islands#icon', iconColor: '#ff0000' }
        );

        map.geoObjects.add(placemark);
        
        // Сохраняем ссылку на карту
        document.getElementById('map')._yandexMap = map;
      });
    } catch (error) {
      console.error('Error initializing Yandex Map:', error);
    }
  };

    if (window.ymaps) {
      initMap();
    } else {
      checkInterval = setInterval(() => {
        if (window.ymaps) {
          clearInterval(checkInterval);
          initMap();
        }
      }, 100);
    }

    return () => {
      if (checkInterval) clearInterval(checkInterval);
      if (map) map.destroy();
    };
  }, [place, t]);
  useEffect(() => {
    fetch(`${API}/places/${id}`)
      .then(res => res.json())
      .then(setPlace);

    const likeUrl = user 
      ? `${API}/likes/place/${id}?user_id=${user.id}`
      : `${API}/likes/place/${id}`;

    fetch(likeUrl)
      .then(res => res.json())
      .then(data => {
        setLikeCount(data.likeCount);
        setLikedByUser(data.likedByUser || false);
      });

    fetch(`${API}/comments/place/${id}`)
      .then(res => res.json())
      .then(setComments);

    if (user) {
      fetch(`${API}/favorites/place/${id}?user_id=${user.id}`)
        .then(res => res.json())
        .then(data => setIsFavorited(data.isFavorited || false));
    }
  }, [id, user]);

  const addToFavorites = async (placeId) => {
    if (!user) return alert(t('place.login_required_favorite'));
    if (isFavorited) return alert(t('place.already_favorited'));

    const res = await fetch(`${API}/favorites/${placeId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: user.id }),
    });

    if (res.ok) setIsFavorited(true);
  };

  const toggleLike = async () => {
    if (!user) return alert(t('place.login_required_like'));

    await fetch(`${API}/likes/place/${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: user.id }),
    });

    const res = await fetch(`${API}/likes/place/${id}?user_id=${user.id}`);
    const data = await res.json();
    setLikeCount(data.likeCount);
    setLikedByUser(data.likedByUser);
  };

  const submitComment = async () => {
    if (!user) return alert(t('place.login_required_comment'));
    if (!commentText.trim()) return;

    const res = await fetch(`${API}/comments/place/${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: user.id, content: commentText }),
    });

    if (res.ok) {
      setCommentText('');
      const updated = await fetch(`${API}/comments/place/${id}`).then(res => res.json());
      setComments(updated);
    }
  };

  // Функции для галереи
  const openGallery = (index) => {
    setCurrentImageIndex(index);
    setGalleryOpen(true);
    document.body.style.overflow = 'hidden';
  };

  const closeGallery = () => {
    setGalleryOpen(false);
    document.body.style.overflow = 'auto';
  };

  const goToPrev = () => {
    setCurrentImageIndex(prev => 
      prev === 0 ? place.images.length - 1 : prev - 1
    );
  };

  const goToNext = () => {
    setCurrentImageIndex(prev => 
      prev === place.images.length - 1 ? 0 : prev + 1
    );
  };

  if (!place) return <div>{t('common.loading')}</div>;

  return (
    <div className="page-container">
      <article className="place-detail">
        <header className="place-header">
          <h1 className="place-title">{place.title}</h1>
          <time className="place-date">
            {t('place.added_on')} {new Date(place.created_at).toLocaleString(t('locale'))}
          </time>
        </header>
        
        <div className="place-description">
          <p>{place.description}</p>
        </div>

        {place.images?.length > 0 && (
          <section className="gallery-section">
            <h2 className="section-title">{t('place.photos')}</h2>
            <div className="gallery-grid">
              {place.images.map((img, index) => (
                <div 
                  key={index} 
                  className="gallery-thumbnail"
                  onClick={() => openGallery(index)}
                >
                  <img
                    src={`http://localhost:5000${img}`}
                    alt={`${t('place.photo')} ${index + 1}`}
                    className="thumbnail-image"
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="map-section">
          <h2 className="section-title">{t('place.map')}</h2>
          <div id="map" className="map-container"></div>
        </section>

        <div className="place-actions">
          <button 
            onClick={toggleLike} 
            className={`like-btn ${likedByUser ? 'liked' : ''}`}
          >
            {likedByUser ? `❤️ ${t('place.unlike')}` : `🤍 ${t('place.like')}`}
            <span className="like-count">{likeCount}</span>
          </button>
          
          <button 
            onClick={() => addToFavorites(id)} 
            disabled={isFavorited}
            className={`favorite-btn ${isFavorited ? 'favorited' : ''}`}
          >
            {isFavorited ? `⭐ ${t('place.already_favorite')}` : t('place.add_to_favorites')}
          </button>
        </div>

        <section className="comments-section">
          <h2 className="section-title">{t('place.comments')}</h2>
          
          {user ? (
            <form onSubmit={submitComment} className="comment-form">
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                rows={3}
                placeholder={t('place.comment_placeholder')}
                className="comment-input"
              />
              <button type="submit" className="btn">{t('place.submit_comment')}</button>
            </form>
          ) : (
            <p className="login-prompt">
              {t('place.login_to_comment')} <Link to="/login">{t('place.login')}</Link>.
            </p>
          )}

          {comments.length > 0 ? (
            <ul className="comments-list">
              {comments.map((c) => (
                <li key={c.id} className="comment-item">
                  <div className="comment-header">
                    <strong className="comment-author">{c.username}</strong>
                    <time className="comment-date">
                      {new Date(c.created_at).toLocaleString(t('locale'))}
                    </time>
                  </div>
                  <p className="comment-content">{c.content}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="no-comments">{t('place.no_comments')}</p>
          )}
        </section>

        {galleryOpen && (
          <div className="gallery-modal">
            <button onClick={closeGallery} className="close-gallery-btn">
              ×
            </button>
            
            <div className="gallery-content">
              <button onClick={goToPrev} className="gallery-nav-btn prev-btn">
                &#10094;
              </button>
              
              <img
                src={`http://localhost:5000${place.images[currentImageIndex]}`}
                alt={`${t('place.photo')} ${currentImageIndex + 1}`}
                className="gallery-image"
              />
              
              <button onClick={goToNext} className="gallery-nav-btn next-btn">
                &#10095;
              </button>
            </div>
            
            <div className="gallery-counter">
              {currentImageIndex + 1} / {place.images.length}
            </div>
          </div>
        )}
      </article>
    </div>
  );
}

export default PlaceDetail;