import useWebsiteContent from '../hooks/useWebsiteContent'
import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import ideas from '../data/tourIdeas.json'
import { getJourneyPlan, placeNotes } from '../data/journeyPlans'
import PageHeader from '../components/common/PageHeader'
import Button from '../components/common/Button'
import TravelFAQ from '../components/common/TravelFAQ'
import NotFoundPage from './NotFoundPage'

export default function JourneyIdeaPage() {
  const { slug } = useParams()
  const { items: published } = useWebsiteContent(
    'journeys',
    ideas.map((x) => ({ ...x, ...getJourneyPlan(x.slug) })),
  )
  const idea = published.find((item) => item.slug === slug)
  const plan = idea ? { ...idea, nights: idea.route.length - 1 } : null
  useEffect(() => {
    if (idea) document.title = `${idea.name} | Ceyvora`
  }, [idea])
  if (!idea || !plan) return <NotFoundPage />
  const enquiry = '/contact?interest=' + encodeURIComponent(idea.name)
  return (
    <>
      <PageHeader
        title={idea.name}
        eyebrow={idea.category}
        description={idea.description}
        image={idea.image}
        imageAlt={idea.name}
      />
      <div className="container planning-layout section">
        <div>
          <Link to="/tours#tour-ideas">← All journey ideas</Link>
          <h2>{plan.heading}</h2>
          <p>{plan.advice}</p>
          <p className="planning-note">
            An original Ceyvora suggested route for discussion:{' '}
            {plan.route.length} days / {plan.nights} nights. This is
            inspiration, not a fixed package or a confirmed departure. Arrival
            times, travel pace and availability may change the plan.
          </p>
          <a
            className="button button-outline"
            href={
              'https://www.google.com/maps/dir/' +
              plan.route
                .map((x) =>
                  encodeURIComponent(x.replaceAll('-', ' ') + ', Sri Lanka'),
                )
                .join('/')
            }
            target="_blank"
            rel="noreferrer"
          >
            View suggested route on Google Maps ↗
          </a>
          <div className="journey-photo-strip">
            {[...new Set(plan.route)].slice(0, 3).map((x) => (
              <img
                key={x}
                src={'/images/destinations/' + x + '.jpg'}
                alt={x.replaceAll('-', ' ')}
                loading="lazy"
              />
            ))}
          </div>
          <h2>Your suggested day-by-day route</h2>
          <div className="itinerary">
            {plan.route.map((place, index) => (
              <details className="itinerary-day" key={index} open={index === 0}>
                <summary>
                  <span className="day-number">Day {index + 1}</span>
                  <h3>
                    {index === plan.route.length - 1 ? 'Return to ' : ''}
                    {placeNotes[place]?.[0] || place.replaceAll('-', ' ')}
                  </h3>
                </summary>
                <div className="itinerary-content">
                  <p>
                    {index === plan.route.length - 1
                      ? 'Allow this day for the return journey. Confirm transfer time against your flight; an additional overnight stay may be more comfortable for an early departure.'
                      : placeNotes[place]?.[1] ||
                        'Discuss your preferred visits and local arrangements for this stop.'}
                  </p>
                  {index < plan.nights && (
                    <p>
                      <strong>Suggested overnight base:</strong>{' '}
                      {placeNotes[place]?.[0] || place.replaceAll('-', ' ')}.
                      Property and meals to be agreed in your quote.
                    </p>
                  )}
                  <Link to={'/destinations/' + place}>
                    Explore{' '}
                    {placeNotes[place]?.[0] || place.replaceAll('-', ' ')} →
                  </Link>
                </div>
              </details>
            ))}
          </div>
          <section className="detail-section">
            <h2>Stays and getting around</h2>
            <p>
              Discuss small guesthouses, boutique stays or larger hotels
              according to your budget. Confirm the property, room category,
              accessibility and meal plan before booking.
            </p>
            <p>
              For this suggested route, ask about road transfers between
              overnight bases and local transport for visits. Confirm vehicle
              size, luggage space, driver arrangements and any rail tickets
              separately.
            </p>
          </section>
          <section className="detail-section">
            <h2>What your quote should cover</h2>
            <ul>
              <li>Named accommodation, nights, room type and meals.</li>
              <li>
                Transfers, vehicle arrangements, guiding and activity fees.
              </li>
              <li>Taxes, payment dates and cancellation conditions.</li>
            </ul>
            <h3>Budget separately unless explicitly included</h3>
            <p>
              Flights, visa fees, insurance, personal purchases, tips, optional
              excursions and meals outside the agreed plan. Do not assume an
              item is included until it appears in your quote.
            </p>
          </section>
        </div>
        <aside className="planning-aside">
          <p className="directory-region">Make it your own</p>
          <h2>{plan.route.length} days, at your pace.</h2>
          <p>{plan.nights} suggested nights • Flexible route</p>
          <p>
            No fixed price is published for this journey idea. Share your dates,
            group size and preferred stays for a personalised quote.
          </p>
          <Button to={enquiry}>Request a quote</Button>
          <p className="small-text">Enquiry only. No reservation or payment.</p>
        </aside>
      </div>
      <TravelFAQ />
    </>
  )
}
