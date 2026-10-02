import { useCallback, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import useResource from '../hooks/useResource'
import { getTourPackageBySlug } from '../services/tourPackageService'
import DetailState from '../components/details/DetailState'
import DetailHero from '../components/details/DetailHero'
import Itinerary from '../components/details/Itinerary'
import ReviewForm from '../components/details/ReviewForm'
import PackageReviews from '../components/details/PackageReviews'
import TravelImage from '../components/common/TravelImage'
import Button from '../components/common/Button'

export default function TourDetailsPage() {
  const { slug } = useParams()
  const load = useCallback(
    (signal) => getTourPackageBySlug(slug, signal),
    [slug],
  )
  const resource = useResource(load)
  const tour = resource.data
  useEffect(() => {
    if (tour) document.title = tour.title + ' | Ceyvora'
  }, [tour])
  const contact = tour
    ? '/contact?package=' + encodeURIComponent(tour.slug)
    : '/contact'
  const places = [...(tour?.destinations || [])].sort(
    (a, b) => a.visitOrder - b.visitOrder || a.id - b.id,
  )
  return (
    <DetailState resource={resource} kind="journey" to="/tours">
      {tour && (
        <>
          <DetailHero
            title={tour.title}
            description={tour.shortDescription}
            path={tour.heroImageUrl}
            kind="journey"
          >
            <div className="hero-journey-facts">
              <p>
                {tour.durationDays} days / {tour.durationNights} nights
              </p>
              <Button to={contact}>Request a quote</Button>
            </div>
          </DetailHero>
          <nav className="guide-jump container" aria-label="Journey sections">
            <a href="#overview">Overview</a>
            <a href="#places-heading">Destinations</a>
            <a href="#itinerary-heading">Day by day</a>
            <a href="#reviews-heading">Reviews</a>
          </nav>
          <div className="container tour-detail-layout">
            <div className="tour-reading-column">
              <section
                id="overview"
                className="detail-section overview-section"
              >
                <h2>A little about this journey</h2>
                <p className="preserve-lines">{tour.description}</p>
              </section>
              <section
                className="detail-section"
                aria-labelledby="places-heading"
              >
                <h2 id="places-heading">Places you’ll discover</h2>
                {places.length ? (
                  <ol className="included-places">
                    {places.map((place) => (
                      <li key={place.id}>
                        <Link
                          to={'/destinations/' + encodeURIComponent(place.slug)}
                        >
                          <TravelImage path={place.imageUrl} alt={place.name} />
                          <span>{place.name}</span>
                          {(place.district || place.province) && (
                            <small>
                              {[place.district, place.province]
                                .filter(Boolean)
                                .join(', ')}
                            </small>
                          )}
                        </Link>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <div className="detail-empty">
                    <p>
                      Destinations for this journey haven’t been listed yet.
                    </p>
                  </div>
                )}
              </section>
              <Itinerary key={tour.id} days={tour.itineraryDays || []} />
              <PackageReviews reviews={tour.approvedReviews || []} />
              <ReviewForm key={'review-' + tour.id} tourPackageId={tour.id} />
            </div>
            <aside className="journey-plan">
              <h2>Your journey, at a glance</h2>
              <dl>
                <dt>Duration</dt>
                <dd>
                  {tour.durationDays} days / {tour.durationNights} nights
                </dd>
              </dl>
              <p>
                Share your dates and interests to discuss this journey.
                Availability and final pricing will need to be confirmed.
              </p>
              <Button to={contact}>Request a quote</Button>
            </aside>
          </div>
          <section className="cta-section">
            <div className="container cta-inner">
              <div>
                <h2>Interested in this journey?</h2>
                <p>Let’s talk about how {tour.title} could fit your plans.</p>
              </div>
              <div className="button-row">
                <Button to={contact}>Request a quote</Button>
                <Button to={contact} variant="outline">
                  Contact us
                </Button>
              </div>
            </div>
          </section>
        </>
      )}
    </DetailState>
  )
}
