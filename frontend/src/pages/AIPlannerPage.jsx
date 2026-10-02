import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import PageMetadata from '../components/common/PageMetadata'
import { createJourneyPlan } from '../services/journeyPlannerService'

const samples = [
  [
    '🏛️',
    'A cultural escape in Jaffna',
    'Plan a relaxed 2-day trip to Jaffna for 2 people. We enjoy culture and local food.',
  ],
  [
    '🌊',
    'Three days of southern beaches',
    'Plan a relaxed 3-day beach holiday in southern Sri Lanka for 2 people.',
  ],
  [
    '🌿',
    'Nature and scenic walks in Ella',
    'Plan a 4-day trip around Ella and Nuwara Eliya for 3 people. We enjoy nature and scenic walks.',
  ],
  [
    '🐘',
    'Family, wildlife and beaches',
    'Plan a relaxed 5-day family trip for 4 people, including 2 children. We like wildlife and beaches.',
  ],
]
const interests = [
  'Wildlife',
  'Beaches',
  'Nature',
  'Culture',
  'Adventure',
  'Wellness',
]

function Sparkle({ className = '' }) {
  return (
    <svg
      className={className}
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      aria-hidden="true"
    >
      <path d="m12 3 2.4 6.6L21 12l-6.6 2.4L12 21l-2.4-6.6L3 12l6.6-2.4L12 3Z" />
      <path d="m20 2 .6 1.4L22 4l-1.4.6L20 6l-.6-1.4L18 4l1.4-.6L20 2Z" />
    </svg>
  )
}

function PlanningStatus() {
  const [seconds, setSeconds] = useState(0)
  useEffect(() => {
    const timer = window.setInterval(
      () => setSeconds((value) => value + 1),
      1000,
    )
    return () => window.clearInterval(timer)
  }, [])
  return (
    <div className="ai-live-status" role="status">
      <div className="ai-thinking-orb">
        <Sparkle />
      </div>
      <div>
        <strong>
          {seconds < 45
            ? 'AI is shaping your journey'
            : 'Your journey is still being prepared'}
        </strong>
        <p>
          {seconds < 45
            ? 'Finding a route around your preferences and Ceyvora places.'
            : 'This is taking a little longer. You can cancel and try again.'}
        </p>
      </div>
      <span className="ai-elapsed" aria-hidden="true">
        {seconds}s
      </span>
      <div className="ai-thinking-track" aria-hidden="true">
        <span />
      </div>
    </div>
  )
}

function PlannerForm({ onPlan, busy, onCancel }) {
  const [message, setMessage] = useState('')
  const [selected, setSelected] = useState([])
  const promptRef = useRef(null)
  function submit(event) {
    event.preventDefault()
    if (busy) return
    const values = new FormData(event.currentTarget)
    onPlan({
      message: message.trim(),
      days: Number(values.get('days')) || null,
      travellers: Number(values.get('travellers')) || null,
      budget: values.get('budget') ? Number(values.get('budget')) : null,
      interests: selected,
      pace: String(values.get('pace') || 'balanced'),
      mustVisit: String(values.get('mustVisit') || '')
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean)
        .slice(0, 12),
    })
  }
  return (
    <form className="ai-planner-form" onSubmit={submit} aria-busy={busy}>
      <div className="ai-panel-toolbar">
        <Link to="/destinations" className="ai-browse-link">
          Browse destinations
        </Link>
        <span className="ai-mode-pill">
          <Sparkle /> AI journey planner <span>AI</span>
        </span>
        <span className="ai-mode-status">
          <i />
          {busy ? 'Planning' : 'Ready to plan'}
        </span>
      </div>
      <div className="ai-prompt-heading">
        <div>
          <h2 id="planner-form-title">Where shall we go?</h2>
          <p>
            Tell AI where you want to go, what you love and how you like to
            travel.
          </p>
        </div>
        <span className="ai-catalogue-badge">Ceyvora catalogue</span>
      </div>
      <label className="ai-prompt-label" htmlFor="trip-message">
        Describe your ideal Sri Lankan trip
      </label>
      <div className="ai-prompt-composer">
        <Sparkle className="ai-prompt-icon" />
        <textarea
          id="trip-message"
          name="message"
          ref={promptRef}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="e.g. A relaxed 3-day escape in Ella for two, with scenic walks and local food…"
          minLength={8}
          maxLength={3000}
          required
          disabled={busy}
          rows={2}
        />
        <button className="ai-generate-button" type="submit" disabled={busy}>
          <Sparkle />
          {busy ? 'Planning…' : 'Plan with AI'}
        </button>
      </div>
      <div className="ai-sample-prompts">
        <p>Try asking AI</p>
        <div>
          {samples.map(([icon, label, prompt]) => (
            <button
              type="button"
              key={label}
              disabled={busy}
              onClick={() => {
                setMessage(prompt)
                promptRef.current?.focus()
              }}
            >
              <span aria-hidden="true">{icon}</span>
              {label}
            </button>
          ))}
        </div>
      </div>
      <details className="ai-extra-details">
        <summary>
          Fine-tune your trip <span>Optional details</span>
        </summary>
        <fieldset className="ai-detail-fields" disabled={busy}>
          <legend className="ai-prompt-label">Trip preferences</legend>
          <div className="ai-planner-fields">
            <label className="ai-planner-field" htmlFor="trip-days">
              <span>Days</span>
              <input
                id="trip-days"
                name="days"
                type="number"
                min={1}
                max={30}
                placeholder="Optional"
              />
            </label>
            <label className="ai-planner-field" htmlFor="trip-travellers">
              <span>Travellers</span>
              <input
                id="trip-travellers"
                name="travellers"
                type="number"
                min={1}
                max={20}
                placeholder="Optional"
              />
            </label>
            <label className="ai-planner-field" htmlFor="trip-budget">
              <span>Budget · USD</span>
              <input
                id="trip-budget"
                name="budget"
                type="number"
                min={0}
                max={10000000}
                step={50}
                placeholder="Optional"
              />
            </label>
          </div>
          <fieldset className="ai-planner-field">
            <legend>What are you drawn to?</legend>
            <div className="ai-planner-chips">
              {interests.map((interest) => (
                <button
                  key={interest}
                  type="button"
                  disabled={busy}
                  aria-pressed={selected.includes(interest)}
                  className={selected.includes(interest) ? 'is-selected' : ''}
                  onClick={() =>
                    setSelected((current) =>
                      current.includes(interest)
                        ? current.filter((value) => value !== interest)
                        : [...current, interest],
                    )
                  }
                >
                  {interest}
                </button>
              ))}
            </div>
          </fieldset>
          <div className="ai-planner-fields ai-planner-options">
            <label className="ai-planner-field" htmlFor="trip-pace">
              <span>Your pace</span>
              <select id="trip-pace" name="pace" defaultValue="balanced">
                <option value="relaxed">Relaxed</option>
                <option value="balanced">Balanced</option>
                <option value="active">Active</option>
              </select>
            </label>
            <label className="ai-planner-field" htmlFor="trip-places">
              <span>Places you have in mind</span>
              <input
                id="trip-places"
                name="mustVisit"
                maxLength={500}
                placeholder="Ella, Galle… (optional)"
              />
            </label>
          </div>
        </fieldset>
      </details>
      {busy && (
        <>
          <PlanningStatus />
          <button type="button" className="ai-cancel-button" onClick={onCancel}>
            Cancel planning
          </button>
        </>
      )}
      <p className="ai-planner-privacy">
        AI creates a suggested itinerary from real Ceyvora places. No booking is
        made.
      </p>
    </form>
  )
}

function PlannerResult({ result, onReset }) {
  return (
    <section
      className="ai-planner-result"
      aria-labelledby="planner-result-title"
      aria-live="polite"
    >
      <div className="ai-result-heading">
        <div>
          <p className="ai-planner-kicker">Your AI-crafted journey</p>
          <h2 id="planner-result-title">{result.title}</h2>
          <p>{result.summary}</p>
        </div>
        <button
          className="button button-outline"
          onClick={onReset}
          type="button"
        >
          Plan another journey
        </button>
      </div>
      <ol className="ai-itinerary">
        {result.itinerary.map((day) => (
          <li key={day.day}>
            <div className="ai-day-marker">
              <span>Day</span>
              <strong>{String(day.day).padStart(2, '0')}</strong>
            </div>
            <div className="ai-day-copy">
              <p className="ai-day-place">
                {day.destinationSlug ? (
                  <Link
                    to={
                      '/destinations/' + encodeURIComponent(day.destinationSlug)
                    }
                  >
                    {day.destination}
                  </Link>
                ) : (
                  day.destination
                )}
              </p>
              <h3>{day.title}</h3>
              <p>{day.description}</p>
              {day.sourceType === 'tour' && (
                <span className="ai-source-note">
                  From a saved CEYVORA tour itinerary
                </span>
              )}
            </div>
          </li>
        ))}
      </ol>
      <div className="ai-result-bottom">
        <div className="ai-result-notes">
          {result.matchedTour && (
            <article className="ai-matched-tour">
              <p className="ai-planner-kicker">A matching CEYVORA tour</p>
              <h3>{result.matchedTour.name}</h3>
              <p>
                {result.matchedTour.durationDays} days · Tailored to your dates
              </p>
              <Link
                className="button button-outline"
                to={'/tours/' + encodeURIComponent(result.matchedTour.slug)}
              >
                View tour details
              </Link>
              <small>
                Request a personalised quote after discussing your dates and
                preferences.
              </small>
            </article>
          )}
          {result.reasons?.length > 0 && (
            <div className="ai-result-reasons">
              <h3>Why this route fits</h3>
              <ul>
                {result.reasons.map((reason, index) => (
                  <li key={index}>{reason}</li>
                ))}
              </ul>
            </div>
          )}
          {result.warnings?.length > 0 && (
            <div className="ai-result-warnings" role="note">
              <h3>A note before you go</h3>
              <ul>
                {result.warnings.map((warning, index) => (
                  <li key={index}>{warning}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <aside className="ai-plan-next">
          <p>Make it your own</p>
          <h3>A good plan leaves room for you.</h3>
          <p>
            Share dates and preferences with us to discuss the practical
            details.
          </p>
          <Link
            className="button button-primary"
            to="/contact"
            state={{
              enquiryDraft: `I'd like a quote for this AI-suggested journey: ${result.title}.\n\n${result.itinerary.map((day) => `Day ${day.day}: ${day.destination} — ${day.title}`).join('\n')}\n\nPlease help me confirm the route, stays and travel arrangements.`,
            }}
          >
            Request a quote
          </Link>
        </aside>
      </div>
      <p className="ai-planner-disclaimer">
        This AI-created route is for inspiration. Confirm transport, opening
        times, services, prices and availability with Ceyvora before making
        plans.
      </p>
    </section>
  )
}

export default function AIPlannerPage() {
  const [result, setResult] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const activeRequest = useRef(null)
  useEffect(() => () => activeRequest.current?.abort(), [])
  async function planTrip(payload) {
    const controller = new AbortController()
    activeRequest.current = controller
    setBusy(true)
    setError('')
    setResult(null)
    try {
      const plan = await createJourneyPlan(payload, controller.signal)
      if (!controller.signal.aborted) setResult(plan)
    } catch (err) {
      if (err.name !== 'AbortError')
        setError(
          err.message || 'The planner could not finish. Try again shortly.',
        )
    } finally {
      if (activeRequest.current === controller) {
        setBusy(false)
        activeRequest.current = null
      }
    }
  }
  return (
    <div className="ai-planner-page">
      <PageMetadata
        title="AI Journey Planner"
        description="Shape a Sri Lankan journey around the places and experiences you love."
      />
      <section className="ai-planner-hero">
        <img
          className="ai-hero-landscape"
          src="/images/south-coast.webp"
          alt="Turquoise ocean and sandy beach on the southern coast of Sri Lanka"
          fetchPriority="high"
        />
        <div className="ai-planner-hero-overlay" />
        <div className="container ai-hero-layout">
          <div className="ai-planner-hero-copy">
            <h1 className="ai-hero-signature">
              <Sparkle /> Your AI travel planner
            </h1>
            <p>Tell us your idea. AI will shape the journey.</p>
          </div>
        </div>
        <span className="ai-landscape-caption">South coast · Sri Lanka</span>
      </section>
      <div className="container ai-planner-main">
        {result ? (
          <PlannerResult
            result={result}
            onReset={() => {
              setResult(null)
              setError('')
            }}
          />
        ) : (
          <section
            className="ai-planner-workspace"
            aria-labelledby="planner-form-title"
          >
            <div className="ai-workspace-panel">
              <PlannerForm
                onPlan={planTrip}
                busy={busy}
                onCancel={() => activeRequest.current?.abort()}
              />
              {error && (
                <div className="ai-planner-error" role="alert">
                  <p>{error}</p>
                  <Link
                    className="button button-outline"
                    to="/contact"
                    state={{
                      enquiryDraft:
                        'I would like help planning a Sri Lanka journey. The AI planner was unavailable. Please help me discuss the route and details.',
                    }}
                  >
                    Plan with our team
                  </Link>
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
