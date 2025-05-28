import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Select from 'react-select';
import '../styles/News.css';

function News() {
  const { t } = useTranslation('news');
  const [newsList, setNewsList] = useState([]);
  const [places, setPlaces] = useState([]);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:5000/api/news')
      .then(res => res.json())
      .then(data => {
        setNewsList(data);
        setLoading(false);
      });

    fetch('http://localhost:5000/api/places/names')
      .then(res => res.json())
      .then(data => {
        const options = data.map(p => ({ value: p.id, label: p.name }));
        setPlaces(options);
      });
  }, []);

  const handlePlaceChange = (option) => {
    setSelectedPlace(option);
    if (option) {
      setLoading(true);
      fetch(`http://localhost:5000/api/news/by-place/${option.value}`)
        .then(res => res.json())
        .then(data => {
          setNewsList(data);
          setLoading(false);
        });
    } else {
      fetch('http://localhost:5000/api/news')
        .then(res => res.json())
        .then(data => setNewsList(data));
    }
  };

  return (
    <div className="page-container">
      <div className="header-with-filter">
        <h1>{t('news.title')}</h1>
        <div className="filter-container">
          <Select
            options={places}
            value={selectedPlace}
            onChange={handlePlaceChange}
            isClearable
            placeholder={t('news.filter_placeholder')}
            className="place-select"
            classNamePrefix="select"
          />
        </div>
      </div>

      {loading ? (
        <div className="loading-spinner">{t('news.loading')}</div>
      ) : newsList.length === 0 ? (
        <div className="empty-state">
          <p>{t('news.no_news')}</p>
        </div>
      ) : (
        <div className="news-grid">
          {newsList.map(news => (
            <article key={news.id} className="news-card">
              <Link to={`/news/${news.id}`} className="news-link">
                <h2 className="news-title">{news.title}</h2>
              </Link>
              <p className="news-content">{news.content}</p>
              <time className="news-date">
                {new Date(news.created_at).toLocaleString()}
              </time>
              
              {news.places && news.places.length > 0 && (
                <div className="related-places">
                  <h3 className="related-places-title">{t('news.related_places')}:</h3>
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
                        <h4 className="place-title">{place.title}</h4>
                        <p className="place-description">
                          {place.description}
                        </p>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

export default News;