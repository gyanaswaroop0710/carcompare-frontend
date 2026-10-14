import { useState, useEffect } from 'react';
import { api } from '../api.js';
import { price, trans, engine, mileageUnit, stars, inr, yearlyFuel, emi, computeStats } from '../utils.jsx';
import RadarChart from './RadarChart.jsx';

const FUEL_RATE = { Petrol: 105, Diesel: 92, CNG: 90, Hybrid: 105, Electric: 9 };

function story(cars) {
  const rank = (get, hi) => [...cars].sort((a, b) => hi ? get(b) - get(a) : get(a) - get(b));
  const m = c => `<b>${c.model}</b>`;
  const out = [];
  let [a, b] = rank(c => c.priceLakh, false);
  if (a.priceLakh !== b.priceLakh)
    out.push(`${m(a)} is the cheapest to buy at ${price(a.priceLakh)}, ₹${(b.priceLakh - a.priceLakh).toFixed(1)} L less than ${m(b)}.`);
  [a, b] = rank(c => yearlyFuel(c), false);
  if (yearlyFuel(b) - yearlyFuel(a) > 500)
    out.push(`${m(a)} is the cheapest to run, saving about ${inr(yearlyFuel(b) - yearlyFuel(a))} a year in fuel vs ${m(b)}.`);
  [a, b] = rank(c => c.powerBhp, true);
  if (a.powerBhp !== b.powerBhp)
    out.push(`${m(a)} is the strongest with ${a.powerBhp} bhp, ${a.powerBhp - b.powerBhp} bhp more than ${m(b)}.`);
  [a, b] = rank(c => c.safetyRating, true);
  out.push(a.safetyRating === b.safetyRating && cars.every(c => c.safetyRating === a.safetyRating)
    ? `All share the same ${a.safetyRating}★ safety rating.`
    : `${m(a)} is the safest with a ${a.safetyRating}★ rating.`);
  [a, b] = rank(c => c.bootLitres, true);
  if (a.bootLitres !== b.bootLitres)
    out.push(`${m(a)} has the biggest boot at ${a.bootLitres} L, ${a.bootLitres - b.bootLitres} L more than ${m(b)}.`);
  return out;
}

export default function ComparePage({ cmp, toggleCmp, allCars }) {
  const [cars, setCars] = useState([]);

  useEffect(() => {
    if (cmp.length < 2) { setCars([]); return; }
    api('/api/compare?ids=' + cmp.join(','))
      .then(data => setCars([...data].sort((a, b) => cmp.indexOf(a.id) - cmp.indexOf(b.id))))
      .catch(() => {});
  }, [cmp]);

  if (cmp.length < 2) {
    return <div className="empty">Pick at least 2 cars (up to 4) using "+ Compare" on any car. Selected: {cmp.length}</div>;
  }

  if (!cars.length) return <div className="empty">Loading…</div>;

  const stats = allCars.length ? computeStats(allCars) : null;

  const costFn = c => FUEL_RATE[c.fuelType] / c.mileage;
  const rows = [
    { label: 'Price',             get: c => c.priceLakh,    better: 'low',  fmt: v => price(v) },
    { label: 'Fuel',              get: c => c.fuelType },
    { label: 'Segment',           get: c => c.segment || '—' },
    { label: 'Transmission',      get: c => trans(c) },
    { label: 'Body type',         get: c => c.bodyType },
    { label: 'Mileage',           get: c => c.mileage,       better: 'high', fmt: (v, c) => `${v} ${mileageUnit(c)}` },
    { label: 'Power',             get: c => c.powerBhp,      better: 'high', fmt: v => `${v} bhp` },
    { label: 'Torque',            get: c => c.torqueNm,      better: 'high', fmt: v => `${v} Nm` },
    { label: 'Engine',            get: c => c.engineCc,                      fmt: v => v ? `${v} cc` : 'Electric motor' },
    { label: 'Safety',            get: c => c.safetyRating,  better: 'high', fmt: v => stars(v) },
    { label: 'Seats',             get: c => c.seats,          better: 'high' },
    { label: 'Boot space',        get: c => c.bootLitres,    better: 'high', fmt: v => `${v} L` },
    { label: 'Fuel cost / year*', get: c => yearlyFuel(c),   better: 'low',  fmt: v => inr(v) },
  ];

  const wins = cars.map(() => 0); let judged = 0;
  rows.forEach(({ get, better }) => {
    if (!better) return;
    const v = cars.map(get);
    if (v.every(x => x === v[0])) return;
    judged++;
    const b = better === 'low' ? Math.min(...v) : Math.max(...v);
    v.forEach((x, i) => { if (x === b) wins[i]++; });
  });
  const top = Math.max(...wins);
  const leaders = cars.filter((_, i) => wins[i] === top);

  const storyLines = story(cars);

  return (
    <div style={{ paddingTop: 28 }}>
      {/* Verdict banner */}
      <div className="verdict">
        <span>
          🏆 {leaders.map(c => c.model).join(' & ')}{' '}
          {leaders.length > 1 ? 'tie' : 'leads'} — best in {top} of {judged} categories
        </span>
        <button className="btn" onClick={() => {
          navigator.clipboard?.writeText(location.origin + location.pathname + '#compare=' + cmp.join(','));
        }}>
          Copy share link
        </button>
      </div>

      {/* Insight */}
      {stats && (
        <div className="insight">
          <div className="radar-box">
            <RadarChart cars={cars} stats={stats} />
          </div>
          <div className="story-box">
            <h3>How they stack up</h3>
            <ul>
              {storyLines.map((s, i) => (
                <li key={i} dangerouslySetInnerHTML={{ __html: s }} />
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="cmpwrap">
        <table className="cmp">
          <thead>
            <tr>
              <th className="row-lbl" />
              {cars.map(c => (
                <td key={c.id}>
                  <div className="car-brand">{c.brand}</div>
                  <b>{c.model}</b>
                  <br />
                  <button className="btn" style={{ marginTop: 8, maxWidth: 120 }} onClick={() => toggleCmp(c.id)}>
                    Remove
                  </button>
                </td>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(({ label, get, better, fmt }) => {
              const vals = cars.map(get);
              const best = better ? (better === 'low' ? Math.min(...vals) : Math.max(...vals)) : null;
              const allSame = vals.every(v => v === vals[0]);
              return (
                <tr key={label}>
                  <th className="row-lbl">{label}</th>
                  {cars.map((c, i) => (
                    <td key={c.id} className={best !== null && !allSame && vals[i] === best ? 'best' : ''}>
                      {fmt ? fmt(vals[i], c) : vals[i]}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="muted" style={{ marginTop: 10, fontSize: 13 }}>
        Green = best value in that row. *Fuel cost assumes 15,000 km/year at approx. pump prices.
      </p>
    </div>
  );
}
