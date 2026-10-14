import { useEffect, useState } from 'react';
import { api } from '../api.js';
import CarCard from './CarCard.jsx';
import { computeStats, computeBadges } from '../utils.jsx';

export default function FavoritesPage({ user, onLogin, favIds, toggleFav, toggleCmp, cmp, onDetail, allCars }) {
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const badges = allCars.length ? computeBadges(allCars, computeStats(allCars)) : {};

  useEffect(() => {
    if (!user) { setCars([]); setLoading(false); return; }
    setLoading(true);
    api('/api/favorites')
      .then(setCars)
      .catch(() => setCars([]))
      .finally(() => setLoading(false));
  }, [favIds, user]);

  if (!user) {
    return (
      <div className="empty">
        <p>Log in to save cars and see them here.</p>
        <button className="btn primary lg" style={{ marginTop: 16, flex: 'none' }} onClick={onLogin}>Log in / Sign up</button>
      </div>
    );
  }

  if (loading) return <div className="empty">Loading saved cars…</div>;

  return (
    <section style={{ paddingTop: 28 }}>
      <h2 style={{ marginBottom: 20, letterSpacing: '-.03em' }}>Saved cars</h2>
      {cars.length === 0
        ? <div className="empty">No saved cars yet — tap 🤍 on any car.</div>
        : (
          <div className="grid">
            {cars.map(c => (
              <CarCard
                key={c.id} car={c}
                isFav={favIds.has(c.id)}
                inCmp={cmp.includes(c.id)}
                onFav={toggleFav}
                onCmp={toggleCmp}
                onDetail={onDetail}
                badges={badges[c.id]}
              />
            ))}
          </div>
        )
      }
    </section>
  );
}
