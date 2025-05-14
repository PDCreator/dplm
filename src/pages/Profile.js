import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import API from '../components/api';
import { Link } from 'react-router-dom';

function Profile() {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    if (user) {
      fetch(`${API}/favorites/user/${user.id}`)
        .then(res => res.json())
        .then(setFavorites);
    }
  }, [user]);

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

  if (!user) return <div>Для доступа к профилю, пожалуйста, войдите.</div>;

  return (
    <div style={{ padding: '1rem' }}>
      <h2>{user.username}'s Профиль</h2>
      <p>Добро пожаловать, {user.username}!</p>

      <h3>Ваши избранные места:</h3>
      {favorites.length > 0 ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: '1rem'
        }}>
          {favorites.map(place => (
            <div key={place.id} style={{
              border: '1px solid #ccc',
              borderRadius: '8px',
              padding: '1rem',
              textAlign: 'center',
              boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
            }}>
              <Link to={`/places/${place.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <h4>{place.title}</h4>
              </Link>
              {place.image && (
                <img
                  src={`${API}/uploads/${place.image}`}
                  alt={place.title}
                  style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '6px' }}
                />
              )}
              <button
                onClick={() => removeFromFavorites(place.id)}
                style={{ marginTop: '0.5rem' }}
              >
                Удалить из избранного
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p>У вас пока нет избранных мест.</p>
      )}
    </div>
  );
}

export default Profile;
