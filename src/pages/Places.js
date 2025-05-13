import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

function Places() {
  const [places, setPlaces] = useState([]);

  useEffect(() => {
    fetch('http://localhost:5000/api/places')
      .then(res => res.json())
      .then(data => setPlaces(data))
      .catch(err => console.error('Ошибка при загрузке мест:', err));
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Места</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {places.map(place => (
          <Link
            to={`/places/${place.id}`}
            key={place.id}
            className="border rounded-2xl shadow p-4 hover:shadow-lg transition duration-200 block"
          >
            {place.image && (
              <img
                src={place.image}
                alt={place.title}
                className="w-full h-48 object-cover rounded-xl mb-2"
              />
            )}
            <h2 className="text-xl font-semibold">{place.title}</h2>
            <p className="text-gray-700">{place.description}</p>
            {place.tags && (
              <p className="text-sm text-blue-600 mt-1">#{place.tags.split(',').join(' #')}</p>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}

export default Places;
