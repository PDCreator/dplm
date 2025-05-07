import { useEffect, useState } from 'react';
import { useAuth } from '../AuthContext';

function Admin() {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [news, setNews] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState('');

  const fetchNews = async () => {
    const res = await fetch('http://localhost:5000/api/news');
    const data = await res.json();
    setNews(data);
  };

  useEffect(() => {
    fetchNews();
  }, []);

  if (!user || user.is_admin !== 1) {
    return <div>Нет доступа</div>;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    const url = editingId
      ? `http://localhost:5000/api/news/${editingId}`
      : 'http://localhost:5000/api/news';
    const method = editingId ? 'PUT' : 'POST';

    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content }),
    });

    const data = await response.json();
    if (response.ok) {
      setMessage(editingId ? 'Новость обновлена!' : 'Новость добавлена!');
      setTitle('');
      setContent('');
      setEditingId(null);
      fetchNews();
    } else {
      setMessage(data.message || 'Ошибка');
    }
  };

  const handleEdit = (item) => {
    setTitle(item.title);
    setContent(item.content);
    setEditingId(item.id);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Удалить эту новость?')) return;

    const res = await fetch(`http://localhost:5000/api/news/${id}`, {
      method: 'DELETE',
    });

    if (res.ok) {
      setMessage('Новость удалена');
      fetchNews();
    }
  };

  return (
    <div style={{ padding: '1rem' }}>
      <h2>Админ-панель</h2>

      <form onSubmit={handleSubmit}>
        <h3>{editingId ? 'Редактировать новость' : 'Добавить новость'}</h3>
        {message && <p>{message}</p>}
        <input
          type="text"
          placeholder="Заголовок"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          style={{ width: '100%', marginBottom: '0.5rem' }}
        />
        <textarea
          placeholder="Содержимое"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
          rows={5}
          style={{ width: '100%', marginBottom: '0.5rem' }}
        />
        <button type="submit">{editingId ? 'Обновить' : 'Добавить'}</button>
      </form>

      <h3>Все новости</h3>
      {news.map((item) => (
        <div key={item.id} style={{ borderBottom: '1px solid #ccc', margin: '1rem 0' }}>
          <h4>{item.title}</h4>
          <p>{item.content}</p>
          <button onClick={() => handleEdit(item)}>Редактировать</button>{' '}
          <button onClick={() => handleDelete(item.id)}>Удалить</button>
        </div>
      ))}
    </div>
  );
}

export default Admin;
