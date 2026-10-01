import { Link } from 'react-router-dom'
import TravelImage from '../common/TravelImage'
export default function DetailHero({
  title,
  description,
  location,
  path,
  kind,
  children,
}) {
  return (
    <header className="detail-header editorial-detail-header">
      <nav className="breadcrumbs container" aria-label="Breadcrumb">
        <Link to="/">Home</Link>
        <span aria-hidden="true">/</span>
        <Link to={kind === 'journey' ? '/tours' : '/destinations'}>
          {kind === 'journey' ? 'Tours' : 'Destinations'}
        </Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{title}</span>
      </nav>
      <div className="detail-cinema">
        <div className="detail-hero-image">
          <TravelImage path={path} alt={title} eager />
        </div>
        <div className="detail-title-row container">
          <div>
            {location && <p className="detail-location">{location}</p>}
            <h1>{title}</h1>
            <p className="detail-intro">{description}</p>
          </div>
          {children}
        </div>
      </div>
    </header>
  )
}
