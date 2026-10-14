const AXES = ['Price', 'Running cost', 'Power', 'Safety', 'Space'];
const COLORS = ['#2457ff', '#f08a00', '#12a150', '#d6336c'];
const R = 100, C = 150;

function pt(i, v) {
  const a = (-90 + i * 72) * Math.PI / 180;
  return [(C + Math.cos(a) * R * v).toFixed(1), (C + Math.sin(a) * R * v).toFixed(1)];
}
function ring(v) { return AXES.map((_, i) => pt(i, v).join(',')).join(' '); }

export default function RadarChart({ cars, stats }) {
  if (!stats) return null;

  const radarVals = c => [
    1 - (c.priceLakh - stats.minP) / (stats.maxP - stats.minP),
    1 - (stats.cost(c) - stats.minC) / (stats.maxC - stats.minC),
    c.powerBhp / stats.maxPw,
    c.safetyRating / 5,
    (c.seats / 7 + c.bootLitres / stats.maxB) / 2,
  ];

  return (
    <div>
      <svg viewBox="0 0 300 300" className="radarsvg" role="img" aria-label="Radar chart comparing selected cars">
        {[.25, .5, .75, 1].map(v => (
          <polygon key={v} points={ring(v)} className="ring" />
        ))}
        {AXES.map((label, i) => {
          const [x, y] = pt(i, 1);
          const [lx, ly] = pt(i, 1.22);
          return (
            <g key={label}>
              <line x1={C} y1={C} x2={x} y2={y} className="ring" />
              <text x={lx} y={ly} textAnchor="middle" dominantBaseline="middle">{label}</text>
            </g>
          );
        })}
        {cars.map((c, k) => (
          <polygon
            key={c.id}
            points={radarVals(c).map((v, i) => pt(i, Math.max(v, .03)).join(',')).join(' ')}
            fill={COLORS[k]}
            fillOpacity=".16"
            stroke={COLORS[k]}
            strokeWidth="2.5"
          />
        ))}
      </svg>
      <div className="legend">
        {cars.map((c, k) => (
          <span key={c.id}>
            <i style={{ background: COLORS[k] }} />
            {c.model}
          </span>
        ))}
      </div>
    </div>
  );
}
