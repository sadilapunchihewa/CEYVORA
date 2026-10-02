import { Link } from 'react-router-dom'
import TravelImage from './TravelImage'
export function DestinationCard({ item, variant }) {
  if (variant === 'directory')
    return (
      <article className="destination-directory-card">
        <Link
          to={'/destinations/' + encodeURIComponent(item.slug)}
          className="directory-photo"
          aria-label={'Explore ' + item.name}
        >
          <TravelImage
            path={item.imageUrl}
            alt={item.name}
            collection="places"
          />
        </Link>
        <div className="directory-copy">
          <p className="directory-region">{item.province || 'Sri Lanka'}</p>
          <h3>
            <Link to={'/destinations/' + encodeURIComponent(item.slug)}>
              {item.name}
            </Link>
          </h3>
          <p>{item.shortDescription}</p>
          <Link
            className="directory-link"
            to={'/destinations/' + encodeURIComponent(item.slug)}
          >
            Discover {item.name} <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </article>
    )
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

  let category = ''
  let displayDesc = item.shortDescription || ''
  if (displayDesc.startsWith('[')) {
    const endIdx = displayDesc.indexOf(']')
    if (endIdx > 1) {
      category = displayDesc.substring(1, endIdx)
      displayDesc = displayDesc.substring(endIdx + 1).trim()
    }
  }

  return (
    <article
      className={`travel-card tour-card${variant === 'editorial' ? ' tour-card-editorial' : ''}`}
    >
      <div className="tour-card-photo-wrapper">
        <TravelImage
          path={item.heroImageUrl}
          alt={item.title}
          collection="journeys"
        />
        {category && (
          <div className="tour-experience-tag">
            <span className="tag-icon" aria-hidden="true">
              ✦
            </span>
            <span className="tag-text">{category}</span>
          </div>
        )}
      </div>
      <div className="card-body">
        {variant === 'editorial' && (
          <p className="journey-index">
            {String(index + 1).padStart(2, '0')} / JOURNEY
          </p>
        )}
        <p className="card-meta">
          {item.durationDays} days / {item.durationNights} nights
        </p>
        <h3>
          <Link to={'/tours/' + encodeURIComponent(item.slug)}>
            {item.title}
          </Link>
        </h3>
        {route.length > 0 && (
          <p
            className="journey-route"
            aria-label={'Route: ' + route.join(', ')}
          >
            {route.map((place, placeIndex) => (
              <span key={`${place}-${placeIndex}`}>
                {place}
                {placeIndex < route.length - 1 && <i aria-hidden="true"> → </i>}
              </span>
            ))}
          </p>
        )}
        <p className="tour-card-desc">{displayDesc}</p>
        <div className="card-bottom">
          <div>
            <span>Personalised journey</span>
            <strong>Quote on request</strong>
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
