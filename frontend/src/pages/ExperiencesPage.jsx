import InnerPageHero from '../components/common/InnerPageHero'
import { useEffect, useRef } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Pagination from '../components/browse/Pagination'
import CTASection from '../components/home/CTASection'
import experiences from '../data/experiences.json'

export default function ExperiencesPage() {
  const [params, setParams] = useSearchParams()
  const query = params.get('search') || ''
  const category = params.get('category') || 'All experiences'
  const filtered = experiences.filter(
    (item) =>
      (category === 'All experiences' || item.category === category) &&
      `${item.name} ${item.destination} ${item.description}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  )
  const totalPages = Math.max(1, Math.ceil(filtered.length / 9))
  const requestedPage = Number(params.get('page'))
  const page =
    Number.isInteger(requestedPage) && requestedPage > 0
      ? Math.min(requestedPage, totalPages)
      : 1
  const visible = filtered.slice((page - 1) * 9, page * 9)
  const results = useRef(null)
  const previousPage = useRef(page)
  useEffect(() => {
    if (page !== previousPage.current) {
      results.current?.scrollIntoView({ block: 'start' })
      results.current?.focus({ preventScroll: true })
    }
    previousPage.current = page
  }, [page])
  function update(key, value) {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    if (key !== 'page') next.delete('page')
    setParams(next)
  }
  return (
    <>
      <InnerPageHero
        eyebrow="Go a little further"
        title="Feel the island come alive."
        description="Small discoveries. Lasting memories. Experiences worth slowing down for."
        image="/images/tour-ideas/experiential-east.jpg"
        imageAlt="Surfers wading into golden waves on Sri Lanka’s east coast"
        href="#experience-directory"
        linkText="Explore experiences"
      />
      <section
        className="section container experience-directory"
        id="experience-directory"
      >
        <div className="directory-intro">
          <nav aria-label="Breadcrumb">
            <Link to="/">Home</Link> / Experiences
          </nav>
          <p>A closer connection to the island</p>
          <h2>Follow your curiosity.</h2>
          <p>
            Temple courtyards, forest trails, coastal afternoons and encounters
            with the wild. Find something that speaks to you and make it part of
            your journey.
          </p>
        </div>
        <form
          className="experience-directory-filters"
          onSubmit={(event) => {
            event.preventDefault()
            update(
              'search',
              new FormData(event.currentTarget).get('search').trim(),
            )
          }}
        >
          <label>
            Search experiences
            <input
              key={query}
              name="search"
              defaultValue={query}
              maxLength="200"
              placeholder="Try Kandy, waterfalls or wildlife"
              type="search"
            />
          </label>
          <label>
            Your interests
            <select
              value={category}
              onChange={(event) => update('category', event.target.value)}
            >
              {[
                'All experiences',
                'Culture',
                'Nature',
                'Coast',
                'Wildlife',
                'Adventure',
              ].map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          </label>
          <button className="button button-primary" type="submit">
            Find experiences
          </button>
          <button
            className="text-action"
            type="button"
            onClick={() => setParams({})}
          >
            Reset
          </button>
        </form>
        <div
          ref={results}
          tabIndex="-1"
          className="experience-directory-results"
        >
          <p role="status">
            {filtered.length}{' '}
            {filtered.length === 1 ? 'experience' : 'experiences'} to discover
          </p>
          {visible.length ? (
            <div className="destination-directory-grid">
              {visible.map((item) => (
                <article className="destination-directory-card" key={item.slug}>
                  <div className="experience-photo">
                    <img
                      src={item.image}
                      alt={item.name}
                      width="800"
                      height="550"
                      loading="lazy"
                    />
                  </div>
                  <div className="directory-copy">
                    <p className="directory-region">
                      {item.destination} / {item.category}
                    </p>
                    <h3>{item.name}</h3>
                    <p>{item.description}</p>
                    <Link
                      className="directory-link"
                      to={
                        '/destinations/' +
                        item.destination.toLowerCase().replaceAll(' ', '-')
                      }
                    >
                      Explore {item.destination}{' '}
                      <span aria-hidden="true">↗</span>
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="resource-state">
              <h3>No matching experiences</h3>
              <p>Try another place or choose a different interest.</p>
              <button
                className="button button-primary"
                onClick={() => setParams({})}
              >
                Show all experiences
              </button>
            </div>
          )}
          <Pagination
            page={page}
            totalPages={totalPages}
            onChange={(next) => update('page', String(next))}
            name="experiences"
          />
        </div>
        <div className="experience-tour-invitation">
          <h2>Bring your favourites together.</h2>
          <p>
            Browse journeys, then tell us which experiences you’d like to
            include. Availability and arrangements are confirmed during
            planning.
          </p>
          <Link className="button button-primary" to="/tours">
            Explore Sri Lanka tours
          </Link>
        </div>
      </section>
      <CTASection />
    </>
  )
}
