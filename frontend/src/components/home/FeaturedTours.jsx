import SectionTitle from '../common/SectionTitle'
import ResourceState from '../common/ResourceState'
import { TourCard } from '../common/TravelCard'
export default function FeaturedTours({ resource }) {
  return (
    <section className="section tour-section">
      <div className="container">
        <SectionTitle
          title="Handpicked journeys"
          description="A starting point for your next adventure, with room to make it your own."
          to="/tours"
          linkLabel="Explore all tours"
        />
        <ResourceState
          resource={resource}
          name="tours"
          empty={!resource.data?.length}
        >
          <div className="tour-grid featured-journeys">
            {resource.data?.slice(0, 3).map((item) => (
              <TourCard key={item.id} item={item} />
            ))}
          </div>
        </ResourceState>
      </div>
    </section>
  )
}
