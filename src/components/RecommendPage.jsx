import { useState, useEffect } from 'react';
import { api } from '../api.js';
import { price, inr, emi } from '../utils.jsx';

const WEIGHTS = { price: 'Low price', mileage: 'Mileage', performance: 'Performance', safety: 'Safety', space: 'Space' };
const PRESETS = {
  student:    [5, 5, 1, 2, 1],
  family:     [2, 3, 1, 5, 5],
  enthusiast: [1, 1, 5, 3, 1],
  balanced:   [3, 3, 3, 3, 3],
};

export default function RecommendPage({ favIds, toggleFav, toggleCmp, onDetail, filters }) {
  const [profile, setProfile]   = useState('balanced');
  const [sliders, setSliders]   = useState({ price: 3, mileage: 3, performance: 3, safety: 3, space: 3 });
  const [budget, setBudget]     = useState(10);
  const [fuel, setFuel]         = useState('');
  const [seats, setSeats]       = useState('');
  const [body, setBody]         = useState('');
  const [results, setResults]   = useState([]);
  const [loading, setLoading]   = useState(false);
  const [searched, setSearched] = useState(false);

  const applyProfile = p => {
    setProfile(p);
    const keys = Object.keys(WEIGHTS);
    const preset = PRESETS[p];
    setSliders(Object.fromEntries(keys.map((k, i) => [k, preset[i]])));
  };

  const go = async () => {
    setLoading(true); setSearched(true);
    try {
      const body_ = {
        budgetLakh: budget || null,
        fuelType: fuel || null,
        minSeats: seats ? +seats : null,
        bodyType: body || null,
        weights: sliders,
        profile,
      };
      const res = await api('/api/recommendations', { method: 'POST', body: JSON.stringify(body_) });
      setResults(res);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section>
      <div className="panel">
        <h2>Find my car</h2>
        <p className="muted">Tell us your budget and what matters. We score every car out of 100.</p>

        {/* Profiles */}
        <div className="chips">
          {[
            { id: 'student',    label: '🎓 Student' },
            { id: 'family',     label: '👨‍👩‍👧 Family' },
            { id: 'enthusiast', label: '🏁 Enthusiast' },
            { id: 'balanced',   label: '⚖️ Balanced' },
          ].map(p => (
            <button key={p.id} className={`chip${profile === p.id ? ' on' : ''}`} onClick={() => applyProfile(p.id)}>
              {p.label}
            </button>
          ))}
        </div>

        {/* Basic filters */}
        <div className="form-grid" style={{ marginTop: 16 }}>
          <label className="field">
            Budget (₹ lakh)
            <input type="number" step="0.5" value={budget} onChange={e => setBudget(+e.target.value)} />
          </label>
          <label className="field">
            Fuel
            <select value={fuel} onChange={e => setFuel(e.target.value)}>
              <option value="">Any</option>
              {(filters?.fuelTypes || []).map(f => <option key={f}>{f}</option>)}
            </select>
          </label>
          <label className="field">
            Min seats
            <select value={seats} onChange={e => setSeats(e.target.value)}>
              <option value="">Any</option>
              <option value="5">5</option>
              <option value="7">7</option>
            </select>
          </label>
          <label className="field">
            Body type
            <select value={body} onChange={e => setBody(e.target.value)}>
              <option value="">Any</option>
              {(filters?.bodyTypes || []).map(b => <option key={b}>{b}</option>)}
            </select>
          </label>
        </div>

        {/* Sliders */}
        <div className="sliders-grid">
          {Object.entries(WEIGHTS).map(([k, label]) => (
            <label key={k} className="field">
              {label}
              <input
                type="range" min={0} max={5} value={sliders[k]}
                onChange={e => setSliders(s => ({ ...s, [k]: +e.target.value }))}
              />
            </label>
          ))}
        </div>

        <button className="btn primary lg" onClick={go} disabled={loading}>
          {loading ? 'Calculating…' : 'Get recommendations'}
        </button>
      </div>

      {/* Results */}
      {searched && !loading && results.length === 0 && (
        <div className="empty">No cars match those requirements. Try relaxing fuel/seats/body type.</div>
      )}

      {results.map((r, i) => {
        const col = r.score >= 75 ? '#16a34a' : r.score >= 55 ? '#d97706' : '#dc2626';
        return (
          <div key={r.car.id} className="reco-item">
            <div className="rank">#{i + 1}</div>
            <div>
              <div className="car-brand">{r.car.brand}</div>
              <b style={{ fontSize: 18 }}>{r.car.model}</b>{' '}
              <span className="car-price" style={{ fontSize: 16 }}>{price(r.car.priceLakh)}</span>
              <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>
                Runs about ₹{r.costPerKm.toFixed(1)}/km · EMI about {inr(r.emi)}/month
              </div>
              <div className="reasons">
                {r.reasons.map((x, j) => (
                  <span key={j} className={`reason${x.startsWith('⚠') ? ' bad' : ''}`}>{x}</span>
                ))}
              </div>
              <div className="card-actions" style={{ maxWidth: 320, marginTop: 12 }}>
                <button className="btn" onClick={() => onDetail(r.car.id)}>Details</button>
                <button className="btn" onClick={() => toggleCmp(r.car.id)}>+ Compare</button>
                <button className="btn" onClick={() => toggleFav(r.car.id)}>
                  {favIds.has(r.car.id) ? '❤️' : '🤍'}
                </button>
              </div>
            </div>
            <div className="score" style={{ background: col }}>{r.score}</div>
          </div>
        );
      })}
    </section>
  );
}
