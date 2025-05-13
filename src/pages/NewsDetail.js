import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import API from '../components/api';

function NewsDetail() {
  const { id } = useParams(); // ID новости из URL
  const { user } = useAuth();

  const [news, setNews] = useState(null);
  const [likeCount, setLikeCount] = useState(0);
  const [likedByUser, setLikedByUser] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');

  useEffect(() => {
    fetch(`${API}/news/${id}`)
      .then(res => res.json())
      .then(setNews);

    if (user) {
      fetch(`${API}/likes/news/${id}?user_id=${user.id}`)
        .then(res => res.json())
        .then(data => {
          setLikeCount(data.likeCount);
          setLikedByUser(data.likedByUser);
        });
    } else {
      fetch(`${API}/likes/news/${id}`)
        .then(res => res.json())
        .then(data => {
          setLikeCount(data.likeCount);
          setLikedByUser(false);
        });
    }

    fetch(`${API}/comments/news/${id}`)
      .then(res => res.json())
      .then(setComments);
  }, [id, user]);

  const toggleLike = async () => {
    if (!user) return alert('Войдите, чтобы ставить лайки');

    const res = await fetch(`${API}/likes/news/${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: user.id }),
    });

    if (res.ok) {
      const likeRes = await fetch(`${API}/likes/news/${id}?user_id=${user.id}`);
      const data = await likeRes.json();
      setLikeCount(data.likeCount);
      setLikedByUser(data.likedByUser);
    }
  };

  const submitComment = async () => {
    if (!user) return alert('Войдите, чтобы комментировать');
    if (!commentText.trim()) return;

    const res = await fetch(`${API}/comments/news/${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: user.id, content: commentText }),
    });

    if (res.ok) {
      setCommentText('');
      const updated = await fetch(`${API}/comments/news/${id}`).then(res => res.json());
      setComments(updated);
    }
  };

  if (!news) return <div>Загрузка...</div>;

  return (
    <div style={{ padding: '1rem' }}>
      <h2>{news.title}</h2>
      <p>{news.content}</p>
      <p><small>Опубликовано: {new Date(news.created_at).toLocaleString()}</small></p>

      <div style={{ marginTop: '1rem' }}>
        <button onClick={toggleLike}>
          {likedByUser ? '❤️ Убрать лайк' : '🤍 Лайкнуть'}
        </button>
        <span style={{ marginLeft: '0.5rem' }}>{likeCount} лайков</span>
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

export default NewsDetail;
