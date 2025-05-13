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
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    fetch(`${API}/places/${id}`)
      .then(res => res.json())
      .then(setPlace);

    if (user) {
      fetch(`${API}/likes/${id}?user_id=${user.id}&type=place`)
        .then(res => res.json())
        .then(data => {
          setLikeCount(data.likeCount);
          setLikedByUser(data.likedByUser);
        });

      fetch(`${API}/favorites/${id}?user_id=${user.id}`)
        .then(res => res.json())
        .then(data => setIsFavorite(data.isFavorite));
    }

    fetch(`${API}/comments/${id}?type=place`)
      .then(res => res.json())
      .then(setComments);
  }, [id, user]);

  const toggleLike = async () => {
    if (!user) return alert('Войдите, чтобы ставить лайки');
    const res = await fetch(`${API}/likes/${id}?type=place`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: user.id }),
    });

    const data = await res.json();
    const updated = await fetch(`${API}/likes/${id}?user_id=${user.id}&type=place`)
      .then(res => res.json());
    setLikeCount(updated.likeCount);
    setLikedByUser(updated.likedByUser);
  };

  const toggleFavorite = async () => {
    if (!user) return alert('Войдите, чтобы добавить в избранное');
    const res = await fetch(`${API}/favorites/${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: user.id }),
    });

    const data = await res.json();
    setIsFavorite(data.isFavorite);
  };

  const submitComment = async () => {
    if (!user) return alert('Войдите, чтобы комментировать');
    if (!commentText.trim()) return;

    const res = await fetch(`${API}/comments/${id}?type=place`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: user.id, content: commentText }),
    });

    if (res.ok) {
      setCommentText('');
      const updated = await fetch(`${API}/comments/${id}?type=place`).then(res => res.json());
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
        <button onClick={toggleFavorite}>
          {isFavorite ? '⭐ Удалить из избранного' : '☆ В избранное'}
        </button>
      </div>

      <div style={{ marginTop: '2rem' }}>
        <h4>Комментарии</h4>

        {user && (
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
        )}

        {!user && <p>Чтобы оставить комментарий, <a href="/login">войдите</a>.</p>}

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
