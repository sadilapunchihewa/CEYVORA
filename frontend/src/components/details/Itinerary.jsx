export default function Itinerary({ days = [] }) {
  const ordered = [...days].sort(
    (a, b) => a.dayNumber - b.dayNumber || a.id - b.id,
  )
  return (
    <section className="detail-section" aria-labelledby="itinerary-heading">
      <h2 id="itinerary-heading">Your journey</h2>
      {ordered.length ? (
        <div className="itinerary">
          {ordered.map((day, index) => (
            <details className="itinerary-day" key={day.id} open={index === 0}>
              <summary>
                <span className="day-number">Day {day.dayNumber}</span>
                <h3>{day.title}</h3>
                <span className="accordion-mark" aria-hidden="true">
                  +
                </span>
              </summary>
              <div className="itinerary-content">
                <p className="preserve-lines">{day.description}</p>
                {(day.accommodation || day.meals) && (
                  <dl>
                    {day.accommodation && (
                      <>
                        <dt>Accommodation</dt>
                        <dd>{day.accommodation}</dd>
                      </>
                    )}
                    {day.meals && (
                      <>
                        <dt>Meals</dt>
                        <dd>{day.meals}</dd>
                      </>
                    )}
                  </dl>
                )}
              </div>
            </details>
          ))}
        </div>
      ) : (
        <div className="detail-empty">
          <p>
            No itinerary is available yet. Contact us to discuss the schedule
            for this journey.
          </p>
        </div>
      )}
    </section>
  )
}
