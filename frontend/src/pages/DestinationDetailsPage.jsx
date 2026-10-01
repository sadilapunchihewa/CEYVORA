import { useCallback, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import useResource from '../hooks/useResource'
import { getDestinationBySlug } from '../services/destinationService'
import DetailState from '../components/details/DetailState'
import DetailHero from '../components/details/DetailHero'
import { TourCard } from '../components/common/TravelCard'
import SectionTitle from '../components/common/SectionTitle'
import Button from '../components/common/Button'

export default function DestinationDetailsPage() {
  const { slug } = useParams()
  const load = useCallback(
    (signal) => getDestinationBySlug(slug, signal),
    [slug],
  )
  const resource = useResource(load)
  const destination = resource.data
  useEffect(() => {
    if (destination) document.title = destination.name + ' | Ceyvora'
  }, [destination])
  return (
    <DetailState resource={resource} kind="destination" to="/destinations">
      {destination && (
        <>
          <DetailHero
            title={destination.name}
            description={destination.shortDescription}
            location={[destination.district, destination.province]
              .filter(Boolean)
              .join(', ')}
            path={destination.imageUrl}
            kind="destination"
          />
          <div className="container destination-overview">
            <div>
              <h2>Get to know {destination.name}</h2>
              <p className="preserve-lines">{destination.description}</p>
            </div>
            <aside className="destination-note">
              <h3>Make it part of your journey</h3>
              <p>
                Explore the tours that include {destination.name}, or tell us
                what you have in mind.
              </p>
              <Button to={'/tours?destinationId=' + destination.id}>
                Find journeys here
              </Button>
              <Button to="/contact" variant="outline">
                Contact us
              </Button>
            </aside>
          </div>
          <section className="section related-tours">
            <div className="container">
              <SectionTitle
                title={'Journeys through ' + destination.name}
                description="Explore a route that brings this place into your trip."
                to={'/tours?destinationId=' + destination.id}
                linkLabel="View all matching tours"
              />
              {destination.tourPackages?.length ? (
                <div className="tour-grid">
                  {destination.tourPackages.map((item) => (
                    <TourCard key={item.id} item={item} />
                  ))}
                </div>
              ) : (
                <div className="detail-empty">
                  <p>
                    No tours are listed for this destination yet. Contact us to
                    discuss your plans.
                  </p>
                </div>
              )}
            </div>
          </section>
        </>
      )}
    </DetailState>
  )
}
