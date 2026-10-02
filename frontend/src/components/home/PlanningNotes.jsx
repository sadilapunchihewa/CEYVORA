import { Link } from 'react-router-dom'
export default function PlanningNotes({ guide = false }) {
  return (
    <section
      className="section container planning-notes"
      aria-labelledby="planning-title"
    >
      <div className="planning-photo">
        <img
          src="/images/fort-walk.webp"
          alt="Walking along the ramparts at Galle Fort"
          width="720"
          height="900"
          loading="lazy"
        />
        <span>A little planning. More room to explore.</span>
      </div>
      <div className="planning-copy">
        <p className="planning-kicker">Before the journey</p>
        <h2 id="planning-title">Turn a wish list into your next trip.</h2>
        <p>
          You don’t need every answer to get started. A few details help shape a
          journey around the way you like to travel.
        </p>
        <ol className="planning-steps">
          <li>
            <h3>Choose your pace</h3>
            <p>
              One region or a wider route? Start with your available days and
              leave room between stops.
            </p>
          </li>
          <li>
            <h3>Make it personal</h3>
            <p>
              Share your interests, travel dates, group size and the comfort
              level you have in mind.
            </p>
          </li>
          <li>
            <h3>Check the details</h3>
            <p>
              Discuss availability, accommodation, transport and what is
              included before confirming your plans.
            </p>
          </li>
        </ol>
        <Link className="text-link" to={guide ? '/contact' : '/experiences'}>
          {guide ? 'Tell us about your trip' : 'Find experiences for your journey'}
        </Link>
      </div>
    </section>
  )
}
