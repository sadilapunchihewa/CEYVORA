import { Link, useParams } from 'react-router-dom'
import useWebsiteContent from '../hooks/useWebsiteContent'
import experiences from '../data/experiences.json'
import PageHeader from '../components/common/PageHeader'
import Button from '../components/common/Button'
import NotFoundPage from './NotFoundPage'
export default function ExperienceDetailsPage() {
  const { slug } = useParams()
  const { items } = useWebsiteContent('experiences', experiences)
  const item = items.find((x) => x.slug === slug)
  if (!item) return <NotFoundPage />
  return (
    <>
      <PageHeader
        title={item.name}
        eyebrow={item.category + ' · ' + item.destination}
        description={item.description}
        image={item.image}
        imageAlt={item.name}
      />
      <section className="section container planning-layout">
        <div>
          <Link to="/experiences">← All experiences</Link>
          <h2>Make room for the experience.</h2>
          <p>{item.description}</p>
          <h3>Time to allow</h3>
          <p>{item.duration || 'Discuss timing when planning your visit.'}</p>
          <h3>Activity level and access</h3>
          <p>
            {item.difficulty ||
              'Ask about walking distances, steps and access before booking.'}
          </p>
          <h3>Before you go</h3>
          <p>
            {item.preparation ||
              'Bring water and weather-appropriate clothing. Confirm opening times and local arrangements.'}
          </p>
          <a
            href={
              'https://www.google.com/maps/search/?api=1&query=' +
              encodeURIComponent(
                item.name + ', ' + item.destination + ', Sri Lanka',
              )
            }
            target="_blank"
            rel="noreferrer"
          >
            Find the location on Google Maps ↗
          </a>
        </div>
        <aside className="planning-aside">
          <h2>Add it to your journey.</h2>
          <p>
            Tell us your dates, group size and interests. Availability, entry
            costs and transport need to be confirmed during planning.
          </p>
          <Button to={'/contact?interest=' + encodeURIComponent(item.name)}>
            Ask about this experience
          </Button>
        </aside>
      </section>
    </>
  )
}
