import { useState, useEffect } from 'react';
import { api } from '../api.js';
import { price, trans, engine, mileageUnit, stars, inr, yearlyFuel, emi } from '../utils.jsx';

export default function CarModal({ carId, onClose, onCmp }) {
  const [car, setCar] = useState(null);
  const [similar, setSimilar] = useState([]);
  const [down, setDown] = useState(20);
  const [rate, setRate] = useState(9);
  const [yrs, setYrs] = useState(5);

  useEffect(() => {
    if (!carId) return;
    api(`/api/cars/${carId}`).then(setCar).catch(() => {});
    api(`/api/cars/${carId}/similar`).then(setSimilar).catch(() => {});
  }, [carId]);

  useEffect(() => {
    const close = e => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', close);
    return () => document.removeEventListener('keydown', close);
  }, [onClose]);

  if (!car) return null;

  const rows = [
    ['Price', price(car.priceLakh)],
    ['Fuel', car.fuelType],
    ['Transmission', trans(car)],
    ['Mileage', `${car.mileage} ${mileageUnit(car)}`],
    ['Power', `${car.powerBhp} bhp`],
    ['Torque', `${car.torqueNm} Nm`],
    ['Engine', engine(car)],
    ['Segment', car.segment || '—'],
    ['Safety', stars(car.safetyRating)],
    ['Seats', car.seats],
    ['Boot space', `${car.bootLitres} L`],
    ['Body type', car.bodyType],
    ['Fuel cost / year*', inr(yearlyFuel(car))],
  ];

  const emiVal = emi(car.priceLakh, down, rate, yrs);

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="sheet">
        <div className="car-brand">{car.brand}</div>
        <h2 style={{ margin: '4px 0 16px', fontSize: 26 }}>{car.model}</h2>

        <table>
          <tbody>
            {rows.map(([label, val]) => (
              <tr key={label}>
                <td>{label}</td>
                <td><strong>{val}</strong></td>
              </tr>
            ))}
          </tbody>
        </table>

        <h4 style={{ margin: '18px 0 8px' }}>Key features</h4>
        <div className="reasons">
          {(car.features || '').split(',').map(f => (
            <span key={f} className="reason">{f.trim()}</span>
          ))}
        </div>

        {similar.length > 0 && (
          <>
            <h4 style={{ margin: '18px 0 8px' }}>Similar cars</h4>
            <div className="reasons">
              {similar.map(s => (
                <span key={s.id} className="reason" style={{ cursor: 'pointer' }}>
                  {s.model} {price(s.priceLakh)}
                </span>
              ))}
            </div>
          </>
        )}

        <h4 style={{ margin: '18px 0 8px' }}>EMI calculator</h4>
        <div className="emi-grid">
          <label className="field">
            Down payment %
            <input type="number" value={down} min={0} max={90} onChange={e => setDown(+e.target.value)} />
          </label>
          <label className="field">
            Interest %
            <input type="number" value={rate} step={0.1} min={0} onChange={e => setRate(+e.target.value)} />
          </label>
          <label className="field">
            Years
            <input type="number" value={yrs} min={1} max={8} onChange={e => setYrs(+e.target.value)} />
          </label>
        </div>
        <div className="emi-out">{inr(emiVal)} / month</div>
        <p className="muted" style={{ fontSize: 12, marginTop: 6 }}>
          *15,000 km/year at approx. pump prices. EMI is on ex-showroom price.
        </p>

        <div className="card-actions" style={{ marginTop: 20 }}>
          <button className="btn" onClick={onClose}>Close</button>
          <button className="btn primary" onClick={() => { onCmp(car.id); onClose(); }}>+ Compare</button>
        </div>
      </div>
    </div>
  );
}
