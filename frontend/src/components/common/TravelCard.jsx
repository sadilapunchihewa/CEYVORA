import { Link } from 'react-router-dom'
import TravelImage from './TravelImage'
export function DestinationCard({ item }) {
  return (
    <article className="travel-card destination-card">
      <div className="destination-portrait">
        <TravelImage path={item.imageUrl} alt={item.name} collection="places" />
        <div className="destination-caption">
          <p>
            {[item.district, item.province].filter(Boolean).join(', ') ||
              'Sri Lanka'}
          </p>
          <h3>{item.name}</h3>
        </div>
      </div>
      <div className="card-body">
        <p>{item.shortDescription}</p>
        <Link
          className="text-link"
          to={'/destinations/' + encodeURIComponent(item.slug)}
        >
          Explore {item.name}
        </Link>
      </div>
    </article>
  )
}
export function TourCard({ item, index = 0, variant }) {
  const route = [...(item.destinations || [])]
    .sort((a, b) => (a.visitOrder || 0) - (b.visitOrder || 0))
    .map((destination) => destination.name)
  return (
    <article
      className={`travel-card tour-card${variant === 'editorial' ? ' tour-card-editorial' : ''}`}
    >
      <TravelImage
        path={item.heroImageUrl}
        alt={item.title}
        collection="journeys"
      />
      <div className="card-body">
        {variant === 'editorial' && (
          <p className="journey-index">
            {String(index + 1).padStart(2, '0')} / JOURNEY
          </p>
        )}
        <p className="card-meta">
          {item.durationDays} days / {item.durationNights} nights
        </p>
        <h3>{item.title}</h3>
        {variant === 'editorial' && route.length > 0 && (
          <p
            className="journey-route"
            aria-label={'Route: ' + route.join(', ')}
          >
            {route.map((place, placeIndex) => (
              <span key={`${place}-${placeIndex}`}>
                {place}
                {placeIndex < route.length - 1 && <i aria-hidden="true" />}
              </span>
            ))}
          </p>
        )}
        <p>{item.shortDescription}</p>
        <div className="card-bottom">
          <div>
            <span className="price-label">From</span>
            <strong>
              {item.currency}{' '}
              {Number(item.startingPrice).toLocaleString('en-US')}
            </strong>
          </div>
          <Link
            className="text-link"
            to={'/tours/' + encodeURIComponent(item.slug)}
          >
            Explore journey <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </article>
  )
}
