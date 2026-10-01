import SectionTitle from '../common/SectionTitle'
import ResourceState from '../common/ResourceState'
import { DestinationCard } from '../common/TravelCard'
export default function FeaturedDestinations({ resource }) {
  return (
    <section className="section container">
      <SectionTitle
        title="Explore Sri Lanka"
        description="A different rhythm around every corner. Find a place that draws you in."
        to="/destinations"
        linkLabel="All destinations"
      />
      <ResourceState
        resource={resource}
        name="destinations"
        empty={!resource.data?.length}
      >
        <div className="destination-grid destination-editorial-grid">
          {resource.data?.slice(0, 4).map((item) => (
            <DestinationCard key={item.id} item={item} />
          ))}
        </div>
      </ResourceState>
    </section>
  )
}
