import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import API from '../components/api';

function PlaceDetail() {
  const { id } = useParams(); // ID места из URL
  const { user } = useAuth();

  const [place, setPlace] = useState(null);
  const [likeCount, setLikeCount] = useState(0);
  const [likedByUser, setLikedByUser] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [isFavorited, setIsFavorited] = useState(false); // Состояние для отслеживания, добавлено ли в избранное

  useEffect(() => {
    // Получить данные о месте
    fetch(`${API}/places/${id}`)
      .then(res => res.json())
      .then(setPlace);

    // Получить лайки
    const likeUrl = user 
      ? `${API}/likes/place/${id}?user_id=${user.id}`
      : `${API}/likes/place/${id}`;

    fetch(likeUrl)
      .then(res => res.json())
      .then(data => {
        setLikeCount(data.likeCount);
        setLikedByUser(data.likedByUser || false);
      });

    // Получить комментарии
    fetch(`${API}/comments/place/${id}`)
      .then(res => res.json())
      .then(setComments);

    // Проверить, добавлено ли место в избранное
    if (user) {
      fetch(`${API}/favorites/place/${id}?user_id=${user.id}`)
        .then(res => res.json())
        .then(data => {
          setIsFavorited(data.isFavorited || false);
        });
    }
  }, [id, user]);

  // Добавить место в избранное
  const addToFavorites = async (placeId) => {
    if (!user) return alert('Войдите, чтобы добавить место в избранное');
    if (isFavorited) return alert('Это место уже в вашем избранном'); // Проверка, если место уже в избранном

    const res = await fetch(`${API}/favorites/${placeId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: user.id }),
    });

    if (res.ok) {
      setIsFavorited(true); // Обновляем состояние, что место добавлено в избранное
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

  if (!place) return <div>Загрузка...</div>;

  return (
    <div style={{ padding: '1rem' }}>
      <h2>{place.name}</h2>
      <p>{place.description}</p>
      <p><small>Добавлено: {new Date(place.created_at).toLocaleString()}</small></p>

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
    </div>
  );
}

export default PlaceDetail;
