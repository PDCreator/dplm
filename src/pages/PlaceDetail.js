import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import API from '../components/api';

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
    <div style={{ padding: '1rem' }}>
      <h2>{place.title}</h2>
      <p>{place.description}</p>
      
      {place.images?.length > 0 && (
        <div style={{
          display: 'flex',
          gap: '1rem',
          marginTop: '1rem',
          flexWrap: 'wrap'
        }}>
          {place.images.map((img, index) => (
            <img
              key={index}
              src={`http://localhost:5000${img}`}
              alt={`Фото ${index + 1}`}
              onClick={() => openGallery(index)}
              style={{
                width: '200px',
                height: '150px',
                objectFit: 'cover',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'transform 0.2s',
                ':hover': {
                  transform: 'scale(1.03)'
                }
              }}
            />
          ))}
        </div>
      )}
      
      <p><small>Добавлено: {new Date(place.created_at).toLocaleString()}</small></p>
      
      <div style={{ marginTop: '2rem' }}>
        <h4>Карта</h4>
        <div id="map" style={{ width: '100%', height: '300px', borderRadius: '8px' }}></div>
      </div>
      
      <div style={{ marginTop: '1rem' }}>
        <button onClick={toggleLike}>
          {likedByUser ? '❤️ Убрать лайк' : '🤍 Лайкнуть'}
        </button>
        <span style={{ marginLeft: '0.5rem' }}>{likeCount} лайков</span>
      </div>

      <div style={{ marginTop: '1rem' }}>
        <button onClick={() => addToFavorites(id)} disabled={isFavorited}>
          {isFavorited ? '⭐ Уже в избранном' : 'Добавить в избранное'}
        </button>
      </div>

      <div style={{ marginTop: '2rem' }}>
        <h4>Комментарии</h4>

        {user ? (
          <div>
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              rows={3}
              placeholder="Напишите комментарий..."
              style={{ width: '100%', marginBottom: '0.5rem' }}
            />
            <button onClick={submitComment}>Отправить</button>
          </div>
        ) : (
          <p>Чтобы оставить комментарий, <a href="/login">войдите</a>.</p>
        )}

        {comments.length > 0 ? (
          <ul>
            {comments.map((c) => (
              <li key={c.id}>
                <b>{c.username}</b> ({new Date(c.created_at).toLocaleString()}):<br />
                {c.content}
              </li>
            ))}
          </ul>
        ) : (
          <p>Пока нет комментариев.</p>
        )}
      </div>

      {/* Галерея в полноэкранном режиме */}
      {galleryOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <button
            onClick={closeGallery}
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              background: 'none',
              border: 'none',
              color: 'white',
              fontSize: '30px',
              cursor: 'pointer'
            }}
          >
            ×
          </button>
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '80%'
          }}>
            <button
              onClick={goToPrev}
              style={{
                background: 'none',
                border: 'none',
                color: 'white',
                fontSize: '40px',
                cursor: 'pointer',
                margin: '0 20px'
              }}
            >
              &#10094;
            </button>
            
            <img
              src={`http://localhost:5000${place.images[currentImageIndex]}`}
              alt={`Фото ${currentImageIndex + 1}`}
              style={{
                maxWidth: '90%',
                maxHeight: '90%',
                objectFit: 'contain'
              }}
            />
            
            <button
              onClick={goToNext}
              style={{
                background: 'none',
                border: 'none',
                color: 'white',
                fontSize: '40px',
                cursor: 'pointer',
                margin: '0 20px'
              }}
            >
              &#10095;
            </button>
          </div>
          
          <div style={{
            color: 'white',
            marginTop: '20px',
            fontSize: '18px'
          }}>
            {currentImageIndex + 1} / {place.images.length}
          </div>
        </div>
      )}
    </div>
  );
}

export default PlaceDetail;