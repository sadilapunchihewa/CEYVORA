import DestinationTips from '../components/details/DestinationTips'
import { useCallback, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import useResource from '../hooks/useResource'
import useWebsiteContent from '../hooks/useWebsiteContent'
import { getDestinationBySlug } from '../services/destinationService'
import DetailState from '../components/details/DetailState'
import TravelImage from '../components/common/TravelImage'
import { TourCard } from '../components/common/TravelCard'
import Button from '../components/common/Button'
import initialExperiences from '../data/experiences.json'
import initialJourneys from '../data/tourIdeas.json'

const sacredCityHighlights = [
  {
    name: 'Sri Maha Bodhi',
    description:
      'Make time for the sacred tree and the living traditions of worship around it.',
  },
  {
    name: 'Ruwanwelisaya',
    description:
      'Discover one of the city’s revered stupas and the open spaces surrounding this place of pilgrimage.',
  },
  {
    name: 'Mihintale',
    description:
      'Discuss a visit to the nearby sacred hill, with its stairways and historic religious sites.',
  },
]

export default function DestinationDetailsPage() {
  const { slug } = useParams()
  const resource = useResource(
    useCallback((signal) => getDestinationBySlug(slug, signal), [slug]),
  )
  const destination = resource.data
  const { items: experiences } = useWebsiteContent(
    'experiences',
    initialExperiences,
  )
  const { items: journeys } = useWebsiteContent('journeys', initialJourneys)
  const highlights = experiences.filter(
    (item) =>
      item.destination?.toLowerCase() === destination?.name.toLowerCase(),
  )
  const relatedJourneys = journeys
    .filter((item) => item.route?.includes(slug))
    .slice(0, 3)
  const enquiry =
    '/contact?interest=' + encodeURIComponent(destination?.name || '')
  useEffect(() => {
    if (destination) document.title = destination.name + ' | Ceyvora'
  }, [destination])
  return (
    <DetailState resource={resource} kind="destination" to="/destinations">
      {destination && (
        <div className="destination-story">
          <header className="destination-story-hero">
            <div className="destination-story-backdrop">
              <TravelImage
                path={destination.imageUrl}
                alt={destination.name}
                eager
              />
            </div>
            <div className="container destination-story-hero-copy">
              <nav
                aria-label="Breadcrumb"
                className="destination-story-breadcrumbs"
              >
                <Link to="/destinations">Destinations</Link>
                <span aria-hidden="true">/</span>
                <span aria-current="page">{destination.name}</span>
              </nav>
              <p className="destination-story-location">
                {[destination.district, destination.province]
                  .filter(Boolean)
                  .join(', ')}
              </p>
              <h1>{destination.name}</h1>
              <p>{destination.shortDescription}</p>
              <a
                href="#destination-story-overview"
                className="destination-story-scroll"
              >
                Discover the place <span aria-hidden="true">↓</span>
              </a>
            </div>
          </header>
          <nav
            className="destination-story-nav"
            aria-label="Destination sections"
          >
            <div className="container">
              <a href="#destination-story-overview">The destination</a>
              {(highlights.length > 0 || slug === 'anuradhapura') && (
                <a href="#destination-highlights">Things to see</a>
              )}
              <a href="#destination-planning">Plan your visit</a>
              <a href="#destination-journeys">Journey ideas</a>
            </div>
          </nav>
          <section
            className="container destination-story-overview"
            id="destination-story-overview"
          >
            <div className="destination-story-heading">
              <p>A closer look</p>
              <h2>
                Get to know
                <br />
                {destination.name}.
              </h2>
              <Link to="/destinations" className="text-link">
                Explore more destinations
              </Link>
            </div>
            <div className="destination-story-description">
              <p className="preserve-lines">{destination.description}</p>
              <Button to={enquiry} variant="outline">
                Plan a visit here
              </Button>
            </div>
          </section>
          {(highlights.length > 0 || slug === 'anuradhapura') && (
            <section
              className="destination-story-highlights"
              id="destination-highlights"
            >
              <div className="container">
                <div className="destination-story-section-title">
                  <div>
                    <p>Worth making time for</p>
                    <h2>Things to see in {destination.name}</h2>
                  </div>
                  <p>
                    Choose what speaks to you. We’ll help fit it into your
                    journey.
                  </p>
                </div>
                {highlights.length > 0 ? (
                  <div className="destination-experience-grid">
                    {highlights.map((item) => (
                      <Link
                        className="destination-experience"
                        to={'/experiences/' + item.slug}
                        key={item.slug}
                      >
                        <div className="destination-experience-photo">
                          <TravelImage path={item.image} alt={item.name} />
                        </div>
                        <div>
                          <p>{item.category}</p>
                          <h3>
                            {item.name}
                            <span aria-hidden="true">↗</span>
                          </h3>
                          <p>{item.description}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="destination-landmark-scene">
                    <div className="destination-landmark-grid">
                      {sacredCityHighlights.map((item) => (
                        <article key={item.name}>
                          <h3>{item.name}</h3>
                          <p>{item.description}</p>
                          <a
                            className="text-link"
                            href={
                              '/contact?interest=' +
                              encodeURIComponent(
                                destination.name + ' — ' + item.name,
                              )
                            }
                          >
                            Ask about a visit
                          </a>
                        </article>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}
          <section
            className="destination-story-planning"
            id="destination-planning"
          >
            <DestinationTips slug={slug} name={destination.name} />
            <div className="container destination-story-invitation">
              <div>
                <p>Your dates. Your pace.</p>
                <h2>
                  Make {destination.name}
                  <br />
                  part of your story.
                </h2>
                <p>
                  Tell us what you love, when you’d like to travel and who’s
                  coming along. We’ll help shape the details and a personalised
                  quote.
                </p>
              </div>
              <Button to={enquiry}>Enquire about this destination</Button>
            </div>
          </section>
          <section
            className="container section destination-story-journeys"
            id="destination-journeys"
          >
            <div className="destination-story-section-title">
              <div>
                <p>Keep exploring</p>
                <h2>Journeys through {destination.name}</h2>
              </div>
              <Link className="text-link" to="/tours">
                All journey ideas
              </Link>
            </div>
            {relatedJourneys.length ? (
              <div className="destination-experience-grid">
                {relatedJourneys.map((item) => (
                  <Link
                    className="destination-experience"
                    key={item.slug}
                    to={'/journeys/' + item.slug}
                  >
                    <div className="destination-experience-photo">
                      <TravelImage path={item.image} alt={item.name} />
                    </div>
                    <div>
                      <p>{item.category}</p>
                      <h3>
                        {item.name}
                        <span aria-hidden="true">↗</span>
                      </h3>
                      <p>{item.description}</p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : destination.tourPackages?.length ? (
              <div className="tour-grid">
                {destination.tourPackages.map((item) => (
                  <TourCard key={item.id} item={item} />
                ))}
              </div>
            ) : (
              <div className="destination-story-open-route">
                <p>
                  Start with {destination.name} and build a route around the
                  places you want to discover.
                </p>
                <Button to={enquiry} variant="outline">
                  Create your journey
                </Button>
              </div>
            )}
          </section>
        </div>
      )}
    </DetailState>
  )
}
