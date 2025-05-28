import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { useTranslation } from 'react-i18next';
import API from '../components/api';
import '../styles/NewsDetail.css';

function NewsDetail() {
  const { t } = useTranslation('placeNewsDetail');
  const { id } = useParams();
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
    if (!user) return alert(t('news.login_required_like'));

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
    if (!user) return alert(t('news.login_required_comment'));
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

  if (!news) return <div>{t('common.loading')}</div>;

  return (
    <div className="page-container">
      <article className="news-detail">
        <header className="news-header">
          <h1 className="news-title">{news.title}</h1>
          <time className="news-date">
            {t('news.published_on')} {new Date(news.created_at).toLocaleString(t('locale'))}
          </time>
        </header>
        
        <div className="news-content">
          <p>{news.content}</p>
        </div>

        <div className="news-actions">
          <button 
            onClick={toggleLike} 
            className={`like-btn ${likedByUser ? 'liked' : ''}`}
          >
            {likedByUser ? `❤️ ${t('news.unlike')}` : `🤍 ${t('news.like')}`}
            <span className="like-count">{likeCount}</span>
          </button>
        </div>

        {news.places && news.places.length > 0 && (
          <section className="related-places-section">
            <h2 className="section-title">{t('news.related_places')}</h2>
            <div className="places-grid">
              {news.places.map(place => (
                <Link 
                  key={place.id} 
                  to={`/places/${place.id}`}
                  className="place-card"
                >
                  {place.image && (
                    <img
                      src={`http://localhost:5000${place.image}`}
                      alt={place.title}
                      className="place-image"
                    />
                  )}
                  <div className="place-info">
                    <h3 className="place-title">{place.title}</h3>
                    <p className="place-description">
                      {place.description}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className="comments-section">
          <h2 className="section-title">{t('news.comments')}</h2>
          
          {user ? (
            <form onSubmit={submitComment} className="comment-form">
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                rows={3}
                placeholder={t('news.comment_placeholder')}
                className="comment-input"
              />
              <button type="submit" className="btn">{t('news.submit_comment')}</button>
            </form>
          ) : (
            <p className="login-prompt">
              {t('news.login_to_comment')} <Link to="/login">{t('news.login')}</Link>.
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
            <p className="no-comments">{t('news.no_comments')}</p>
          )}
        </section>
      </article>
    </div>
  );
}

export default NewsDetail;