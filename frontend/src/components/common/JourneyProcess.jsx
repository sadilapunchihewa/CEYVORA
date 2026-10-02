import { Link } from 'react-router-dom'
const steps = [
  [
    'Share your ideas',
    'Tell us your dates, travel party and the places or experiences you love. A rough idea is enough.',
  ],
  [
    'Shape the journey',
    'Discuss the route, pace, stays and transport. Ask for a personalised quote with clear inclusions and exclusions.',
  ],
  [
    'Confirm the details',
    'Review availability, payment and cancellation terms. Book once the final arrangements are agreed in writing.',
  ],
]
export default function JourneyProcess() {
  return (
    <section
      className="journey-process container"
      aria-labelledby="journey-process-title"
    >
      <div className="journey-process-heading">
        <h2 id="journey-process-title">
          From an idea
          <br />
          to your island journey.
        </h2>
        <p>A clear conversation at every step.</p>
        <Link className="text-link" to="/contact">
          Start your enquiry
        </Link>
      </div>
      <ol>
        {steps.map(([title, description]) => (
          <li key={title}>
            <h3>{title}</h3>
            <p>{description}</p>
          </li>
        ))}
      </ol>
    </section>
  )
}
