import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import API from '../components/api';
import '../styles/PlaceDetail.css'; // или добавить стили в существующий CSS файл
function PlaceDetail() {
  const { id } = useParams();
  const { user } = useAuth();

  const [place, setPlace] = useState(null);
  const [likeCount, setLikeCount] = useState(0);
  const [likedByUser, setLikedByUser] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [isFavorited, setIsFavorited] = useState(false);
  
  // Состояния для галереи
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

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
        .then(data => {
          setIsFavorited(data.isFavorited || false);
        });
    }
  }, [id, user]);

  const addToFavorites = async (placeId) => {
    if (!user) return alert('Войдите, чтобы добавить место в избранное');
    if (isFavorited) return alert('Это место уже в вашем избранном');

    const res = await fetch(`${API}/favorites/${placeId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: user.id }),
    });

    if (res.ok) {
      setIsFavorited(true);
    }
  };

  const toggleLike = async () => {
    if (!user) return alert('Войдите, чтобы ставить лайки');

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
    if (!user) return alert('Войдите, чтобы комментировать');
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

  useEffect(() => {
    if (!place || !window.ymaps || !place.latitude || !place.longitude) return;
  
    window.ymaps.ready(() => {
      const map = new window.ymaps.Map('map', {
        center: [parseFloat(place.latitude), parseFloat(place.longitude)],
        zoom: 14,
      });
  
      const placemark = new window.ymaps.Placemark(
        [parseFloat(place.latitude), parseFloat(place.longitude)],
        {
          balloonContent: place.title || place.name,
        },
        {
          preset: 'islands#icon',
          iconColor: '#ff0000',
        }
      );
  
      map.geoObjects.add(placemark);
    });
  }, [place]);

  // Функции для галереи
  const openGallery = (index) => {
    setCurrentImageIndex(index);
    setGalleryOpen(true);
    document.body.style.overflow = 'hidden'; // Блокируем прокрутку страницы
  };

  const closeGallery = () => {
    setGalleryOpen(false);
    document.body.style.overflow = 'auto'; // Восстанавливаем прокрутку
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

  if (!place) return <div>Загрузка...</div>;

  return (
    <div className="page-container">
      <article className="place-detail">
        <header className="place-header">
          <h1 className="place-title">{place.title}</h1>
          <time className="place-date">
            Добавлено: {new Date(place.created_at).toLocaleString()}
          </time>
        </header>
        
        <div className="place-description">
          <p>{place.description}</p>
        </div>

        {place.images?.length > 0 && (
          <section className="gallery-section">
            <h2 className="section-title">Фотографии</h2>
            <div className="gallery-grid">
              {place.images.map((img, index) => (
                <div 
                  key={index} 
                  className="gallery-thumbnail"
                  onClick={() => openGallery(index)}
                >
                  <img
                    src={`http://localhost:5000${img}`}
                    alt={`Фото ${index + 1}`}
                    className="thumbnail-image"
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="map-section">
          <h2 className="section-title">Карта</h2>
          <div id="map" className="map-container"></div>
        </section>

        <div className="place-actions">
          <button 
            onClick={toggleLike} 
            className={`like-btn ${likedByUser ? 'liked' : ''}`}
          >
            {likedByUser ? '❤️ Убрать лайк' : '🤍 Лайкнуть'}
            <span className="like-count">{likeCount}</span>
          </button>
          
          <button 
            onClick={() => addToFavorites(id)} 
            disabled={isFavorited}
            className={`favorite-btn ${isFavorited ? 'favorited' : ''}`}
          >
            {isFavorited ? '⭐ Уже в избранном' : 'Добавить в избранное'}
          </button>
        </div>

        <section className="comments-section">
          <h2 className="section-title">Комментарии</h2>
          
          {user ? (
            <form onSubmit={submitComment} className="comment-form">
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                rows={3}
                placeholder="Напишите комментарий..."
                className="comment-input"
              />
              <button type="submit" className="btn">Отправить</button>
            </form>
          ) : (
            <p className="login-prompt">
              Чтобы оставить комментарий, <Link to="/login">войдите</Link>.
            </p>
          )}

          {comments.length > 0 ? (
            <ul className="comments-list">
              {comments.map((c) => (
                <li key={c.id} className="comment-item">
                  <div className="comment-header">
                    <strong className="comment-author">{c.username}</strong>
                    <time className="comment-date">
                      {new Date(c.created_at).toLocaleString()}
                    </time>
                  </div>
                  <p className="comment-content">{c.content}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="no-comments">Пока нет комментариев.</p>
          )}
        </section>

        {/* Галерея в полноэкранном режиме */}
        {galleryOpen && (
          <div className="gallery-modal">
            <button
              onClick={closeGallery}
              className="close-gallery-btn"
            >
              ×
            </button>
            
            <div className="gallery-content">
              <button
                onClick={goToPrev}
                className="gallery-nav-btn prev-btn"
              >
                &#10094;
              </button>
              
              <img
                src={`http://localhost:5000${place.images[currentImageIndex]}`}
                alt={`Фото ${currentImageIndex + 1}`}
                className="gallery-image"
              />
              
              <button
                onClick={goToNext}
                className="gallery-nav-btn next-btn"
              >
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