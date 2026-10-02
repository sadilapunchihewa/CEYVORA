import { getDestinationTips } from '../../data/destinationTips'

export default function DestinationTips({ slug, name }) {
  const tips = getDestinationTips(slug)
  if (!tips) return null
  return (
    <section
      className="container section destination-travel-tips"
      aria-labelledby="travel-tips-heading"
    >
      <p className="directory-region">Make time for the place</p>
      <h2 id="travel-tips-heading">Planning your visit to {name}</h2>
      <div className="travel-tips-grid">
        <article>
          <h3>When to go</h3>
          <p>{tips.season}</p>
        </article>
        <article>
          <h3>How long to stay</h3>
          <p>
            Consider {tips.stay} as a starting point. Add time if you prefer
            slower mornings or want to explore beyond the main sights.
          </p>
        </article>
        <article>
          <h3>Getting there</h3>
          <p>{tips.access}</p>
        </article>
        <article>
          <h3>What to bring</h3>
          <p>{tips.packing}</p>
        </article>
      </div>
      <p>
        <strong>Combine it with:</strong> {tips.nearby}.
      </p>
      <p className="small-text">
        Stay lengths are planning suggestions. For seasonal context and current
        weather notices, see{' '}
        <a
          href="https://www.srilanka.travel/weather"
          target="_blank"
          rel="noreferrer"
        >
          Sri Lanka Tourism’s weather guide
        </a>
        .
      </p>
    </section>
  )
}
