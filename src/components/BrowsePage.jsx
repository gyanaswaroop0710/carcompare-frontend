import { useState, useEffect, useCallback } from 'react';
import { api } from '../api.js';
import CarCard from './CarCard.jsx';
import { computeStats, computeBadges } from '../utils.jsx';

const SORT_OPTIONS = [
  { value: 'priceLakh|asc',    label: 'Price: low → high' },
  { value: 'priceLakh|desc',   label: 'Price: high → low' },
  { value: 'mileage|desc',     label: 'Best mileage' },
  { value: 'powerBhp|desc',    label: 'Most powerful' },
  { value: 'torqueNm|desc',    label: 'Most torque' },
  { value: 'engineCc|desc',    label: 'Biggest engine' },
  { value: 'safetyRating|desc',label: 'Safest' },
];

const SEG_ORDER = ['Entry Level', 'Mid Range', 'Family', 'Touring', 'Off-Road', 'Electric', 'Luxury'];

export default function BrowsePage({ cmp, toggleCmp, favIds, toggleFav, onDetail, allCars }) {
  const [filters, setFilters]   = useState({ brands: [], fuelTypes: [], bodyTypes: [], transmissions: [], segments: [], transmissionTypes: [] });
  const [cars, setCars]         = useState([]);
  const [loading, setLoading]   = useState(false);
  const [q, setQ]               = useState('');
  const [brand, setBrand]       = useState('');
  const [body, setBody]         = useState('');
  const [fuel, setFuel]         = useState('');
  const [transmission, setTrans]= useState('');
  const [transType, setTransType]= useState('');
  const [seats, setSeats]       = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sort, setSort]         = useState('priceLakh|asc');
  const [segment, setSegment]   = useState('');
  const [budgetMax, setBudgetMax]= useState('');

  const badges = allCars.length ? computeBadges(allCars, computeStats(allCars)) : {};

  // Load filter options once
  useEffect(() => {
    api('/api/filters').then(setFilters).catch(() => {});
  }, []);

  const load = useCallback(async (overrides = {}) => {
    setLoading(true);
    try {
      const [sortField, dir] = (overrides.sort ?? sort).split('|');
      const p = new URLSearchParams();
      const s = overrides.segment ?? segment;
      const qv = overrides.q ?? q;
      const maxP = overrides.maxPrice ?? overrides.budgetMax ?? maxPrice;
      if (qv)                p.set('q', qv);
      if (overrides.brand ?? brand)  p.set('brand', overrides.brand ?? brand);
      if (overrides.fuel ?? fuel)    p.set('fuelType', overrides.fuel ?? fuel);
      if (overrides.transmission ?? transmission) p.set('transmission', overrides.transmission ?? transmission);
      if (overrides.body ?? body)    p.set('bodyType', overrides.body ?? body);
      if (overrides.seats ?? seats)  p.set('minSeats', overrides.seats ?? seats);
      if (overrides.transType ?? transType) p.set('transType', overrides.transType ?? transType);
      if (maxP) p.set('maxPrice', maxP);
      if (s)    p.set('segment', s);
      p.set('sort', sortField); p.set('dir', dir);
      const data = await api('/api/cars?' + p.toString());
      setCars(data);
    } finally {
      setLoading(false);
    }
  }, [q, brand, fuel, transmission, body, seats, transType, maxPrice, sort, segment]);

  useEffect(() => { load(); }, [load]);

  const setBudget = (max) => {
    setBudgetMax(max);
    setMaxPrice(max);
  };

  return (
    <section>
      {/* Hero */}
      <div className="hero">
        <h1>Find the car that fits your road and your wallet.</h1>
        <p>Compare specs, running cost and EMI side by side across {allCars.length || 29} cars.</p>

        <div className="chips">
          {[{ label: 'Any budget', val: '' }, { label: 'Under ₹6 L', val: '6' }, { label: 'Under ₹10 L', val: '10' }, { label: 'Under ₹15 L', val: '15' }].map(opt => (
            <button key={opt.label} className={`chip${budgetMax === opt.val ? ' on' : ''}`} onClick={() => setBudget(opt.val)}>
              {opt.label}
            </button>
          ))}
        </div>

        <div className="chips">
          <button className={`chip${segment === '' ? ' on' : ''}`} onClick={() => setSegment('')}>All segments</button>
          {SEG_ORDER.filter(s => filters.segments.includes(s)).map(s => (
            <button key={s} className={`chip${segment === s ? ' on' : ''}`} onClick={() => setSegment(s)}>{s}</button>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="filters">
        <input placeholder="Search brand or model…" value={q} onChange={e => setQ(e.target.value)} />

        <select value={brand} onChange={e => setBrand(e.target.value)}>
          <option value="">All brands</option>
          {filters.brands.map(b => <option key={b}>{b}</option>)}
        </select>

        <select value={body} onChange={e => setBody(e.target.value)}>
          <option value="">Any body type</option>
          {filters.bodyTypes.map(b => <option key={b}>{b}</option>)}
        </select>

        <select value={fuel} onChange={e => setFuel(e.target.value)}>
          <option value="">Any fuel</option>
          {filters.fuelTypes.map(f => <option key={f}>{f}</option>)}
        </select>

        <select value={transmission} onChange={e => setTrans(e.target.value)}>
          <option value="">Any transmission</option>
          {filters.transmissions.map(t => <option key={t}>{t}</option>)}
        </select>

        <select value={seats} onChange={e => setSeats(e.target.value)}>
          <option value="">Any seats</option>
          <option value="5">5+ seats</option>
          <option value="7">7 seats</option>
        </select>

        <input type="number" step="0.5" placeholder="Max price (₹ L)" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} />

        <select value={sort} onChange={e => setSort(e.target.value)}>
          {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      <div className="count">{loading ? 'Loading…' : `${cars.length} cars found`}</div>

      {cars.length === 0 && !loading
        ? <div className="empty">No cars match these filters. Clear a filter to see more.</div>
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
