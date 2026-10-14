export const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
export const price = p => '₹' + Number(p).toFixed(1) + ' L';
export const stars = n => '★'.repeat(n) + '☆'.repeat(5 - n);
export const inr = n => '₹' + Number(n).toLocaleString('en-IN');

export const FUEL_RATE = { Petrol: 105, Diesel: 92, CNG: 90, Hybrid: 105, Electric: 9 };

export const yearlyFuel = (c, km = 15000) =>
  Math.round(km / c.mileage * (FUEL_RATE[c.fuelType] || 100));

export const emi = (lakh, down, rate, yrs) => {
  const P = lakh * 1e5 * (1 - down / 100), r = rate / 1200, n = yrs * 12;
  return r ? Math.round(P * r * (1 + r) ** n / ((1 + r) ** n - 1)) : Math.round(P / n);
};

export const trans = c =>
  c.transmission === 'Manual'
    ? 'Manual'
    : c.transmission + (c.transmissionType ? ` (${c.transmissionType})` : '');

export const engine = c => c.engineCc ? `${c.engineCc} cc` : 'Electric motor';
export const mileageUnit = c =>
  c.fuelType === 'Electric' ? 'km/kWh-eq' : c.fuelType === 'CNG' ? 'km/kg' : 'km/l';

// ── SVG Car shapes ────────────────────────────────────────────────────────
export const SHAPES = {
  Sedan:    'M10 60 L18 46 Q22 40 34 38 L62 34 Q76 18 98 17 L128 17 Q146 19 156 34 L178 38 Q192 42 192 60 Z',
  Hatchback:'M10 60 L16 44 Q20 38 32 36 L58 33 Q70 16 94 16 L146 16 Q158 20 160 36 L182 40 Q192 44 192 60 Z',
  SUV:      'M10 60 L14 40 Q18 34 30 32 L52 30 L62 14 L152 12 Q166 14 170 30 L186 34 Q194 40 194 60 Z',
  MPV:      'M8 60 L12 38 Q16 32 28 30 L50 28 L58 12 L162 10 Q178 12 182 28 L192 34 Q198 40 198 60 Z',
};

export function carArtSvg(c) {
  const path = SHAPES[c.bodyType] || SHAPES.Sedan;
  return (
    <svg viewBox="0 0 205 80" aria-hidden="true">
      <path d={path} fill={c.imageColor} />
      <path d="M68 32 L78 20 L126 20 L142 32 Z" fill="#fff" opacity=".4" />
      <circle cx="52" cy="62" r="12" fill="#14181f" />
      <circle cx="150" cy="62" r="12" fill="#14181f" />
      <circle cx="52" cy="62" r="5" fill="#9aa3b2" />
      <circle cx="150" cy="62" r="5" fill="#9aa3b2" />
    </svg>
  );
}

// ── Badges computation (needs allCars + stats) ────────────────────────────
export function computeStats(allCars) {
  const cost = c => FUEL_RATE[c.fuelType] / c.mileage;
  const mx = f => Math.max(...allCars.map(f));
  const mn = f => Math.min(...allCars.map(f));
  return {
    minP: mn(c => c.priceLakh), maxP: mx(c => c.priceLakh),
    minC: mn(cost), maxC: mx(cost),
    maxPw: mx(c => c.powerBhp), maxB: mx(c => c.bootLitres),
    cost,
  };
}

export function computeBadges(allCars, stats) {
  const quality = c =>
    c.safetyRating / 5 * .4 + c.powerBhp / stats.maxPw * .2 +
    (1 - (stats.cost(c) - stats.minC) / (stats.maxC - stats.minC)) * .2 +
    Math.min(1, (c.features || '').split(',').length / 5) * .2;
  const badges = {};
  const add = (c, t) => (badges[c.id] ||= []).push(t);
  [...new Set(allCars.map(c => c.segment).filter(Boolean))].forEach(seg => {
    const g = allCars.filter(c => c.segment === seg);
    if (g.length < 3) return;
    const top = (f, hi) => { const m = (hi ? Math.max : Math.min)(...g.map(f)); return g.filter(c => f(c) === m); };
    top(c => quality(c) / c.priceLakh, true).forEach(c => add(c, 'Best value'));
    top(c => yearlyFuel(c), false).forEach(c => add(c, 'Lowest running cost'));
    top(c => c.powerBhp, true).forEach(c => add(c, 'Most powerful'));
  });
  return badges;
}
