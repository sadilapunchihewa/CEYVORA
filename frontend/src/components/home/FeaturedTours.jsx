import { Link } from 'react-router-dom'
import SectionTitle from '../common/SectionTitle'
import useWebsiteContent from '../../hooks/useWebsiteContent'
import ideas from '../../data/tourIdeas.json'
export default function FeaturedTours() {
  const { items } = useWebsiteContent('journeys', ideas)
  return (
    <section className="section tour-section">
      <div className="container">
        <SectionTitle
          title="Handpicked journeys"
          description="A starting point for your next adventure, with room to make it your own."
          to="/tours"
          linkLabel="Explore all tours"
        />
        <div className="destination-directory-grid">
          {items.slice(0, 3).map((item) => (
            <article className="destination-directory-card" key={item.slug}>
              <div className="experience-photo">
                <img
                  src={item.image}
                  alt={item.name}
                  loading="lazy"
                  width="800"
                  height="550"
                />
              </div>
              <div className="directory-copy">
                <p className="directory-region">{item.category}</p>
                <h3>{item.name}</h3>
                <p>{item.description}</p>
                <Link className="directory-link" to={'/journeys/' + item.slug}>
                  Explore this journey ↗
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
