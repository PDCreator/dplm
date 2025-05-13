import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import API from '../components/api';

function Profile() {
  const { user } = useAuth(); // Получаем информацию о пользователе из контекста
  const [favorites, setFavorites] = useState([]); // Состояние для хранения избранных мест

  // Загружаем избранные места при монтировании компонента
  useEffect(() => {
    if (user) {
      fetch(`${API}/favorites/user/${user.id}`)
        .then(res => res.json())
        .then(setFavorites);
    }
  }, [user]);

  

  // Удалить место из избранного
  const removeFromFavorites = async (placeId) => {
    if (!user) return alert('Войдите, чтобы удалить место из избранного');

    const res = await fetch(`${API}/favorites/${placeId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: user.id }),
    });

    if (res.ok) {
      setFavorites(favorites.filter(place => place.id !== placeId)); // Удаляем место из списка
    }
  };

  // Если пользователь не авторизован
  if (!user) return <div>Для доступа к профилю, пожалуйста, войдите.</div>;

  return (
    <div style={{ padding: '1rem' }}>
      <h2>{user.username}'s Профиль</h2>
      <p>Добро пожаловать, {user.username}!</p>

      <h3>Ваши избранные места:</h3>
      {favorites.length > 0 ? (
        <ul>
          {favorites.map(favorite => (
            <li key={favorite.id}>
              <span>{favorite.name || `Место ${favorite.id}`}</span> {/* Если имя не задано, отображаем ID */}
              <button onClick={() => removeFromFavorites(favorite.id)}>
                Удалить из избранного
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p>У вас пока нет избранных мест.</p>
      )}

    </div>
  );
}

export default Profile;
