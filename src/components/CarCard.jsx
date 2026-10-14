import { carArtSvg, price, trans, mileageUnit, stars } from '../utils.jsx';

export default function CarCard({ car, isFav, inCmp, onFav, onCmp, onDetail, badges }) {
  return (
    <div className="card">
      <div className="thumb">
        {carArtSvg(car)}
        <span className="body-badge">{car.segment || car.bodyType}</span>
        <button
          className="heart-btn"
          onClick={() => onFav(car.id)}
          title={isFav ? 'Remove from saved' : 'Save car'}
        >
          {isFav ? '❤️' : '🤍'}
        </button>
      </div>

      <div className="cbody">
        <div className="car-brand">{car.brand}</div>
        <div className="car-name">{car.model}</div>
        <div className="car-price">{price(car.priceLakh)}</div>

        {badges && badges.length > 0 && (
          <div className="badges">
            {badges.slice(0, 2).map(b => (
              <span key={b} className="badge" title="Best in its segment">{b}</span>
            ))}
          </div>
        )}

        <div className="specs">
          {[
            car.fuelType,
            trans(car),
            `${car.mileage} ${mileageUnit(car)}`,
            `${car.powerBhp} bhp`,
            `${car.torqueNm} Nm`,
            car.engineCc ? `${car.engineCc} cc` : 'Electric',
            `${car.seats} seats`,
            stars(car.safetyRating),
          ].map((s, i) => <span key={i} className="spec-tag">{s}</span>)}
        </div>

        <div className="card-actions">
          <button className="btn" onClick={() => onDetail(car.id)}>Details</button>
          <button
            className={`btn${inCmp ? ' on' : ''}`}
            onClick={() => onCmp(car.id)}
          >
            {inCmp ? '✓ Added' : '+ Compare'}
          </button>
        </div>
      </div>
    </div>
  );
}
