import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import useWebsiteContent from '../../hooks/useWebsiteContent'
import { getJourneyPlan } from '../../data/journeyPlans'
import { Link } from 'react-router-dom'
import initialIdeas from '../../data/tourIdeas.json'
import Pagination from './Pagination'

const PAGE_SIZE = 9
export default function TourIdeas() {
  const { items: ideas } = useWebsiteContent(
    'journeys',
    initialIdeas.map((x) => ({ ...x, ...getJourneyPlan(x.slug) })),
  )
  const [params, setParams] = useSearchParams()
  const search = params.get('search') || ''
  const [category, setCategory] = useState('All interests')
  const visible = ideas.filter(
    (item) =>
      (category === 'All interests' || item.category === category) &&
      (item.name + ' ' + item.description + ' ' + (item.route || []).join(' '))
        .toLowerCase()
        .includes(search.toLowerCase()) &&
      (!params.get('minDays') ||
        item.route?.length >= Number(params.get('minDays'))) &&
      (!params.get('maxDays') ||
        item.route?.length <= Number(params.get('maxDays'))),
  )
  const totalPages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE))
  const requestedPage = Number(params.get('page'))
  const page = Math.min(
    totalPages,
    Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1,
  )
  const pageIdeas = visible.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  function changePage(value) {
    const next = new URLSearchParams(params)
    if (value === 1) next.delete('page')
    else next.set('page', String(value))
    setParams(next)
    document.getElementById('tour-ideas')?.scrollIntoView({ block: 'start' })
  }
  return (
    <section
      id="tour-ideas"
      className="section container tour-ideas"
      aria-labelledby="tour-ideas-title"
    >
      <div className="directory-intro">
        <p>More ways to travel</p>
        <h2 id="tour-ideas-title">
          Start with an idea.
          <br />
          Make it your own.
        </h2>
        <p>
          These journey themes are starting points for a personalised enquiry.
          Tell us what appeals to you; routes, dates and prices are arranged
          during planning.
        </p>
      </div>
      <div
        className="journey-filter-bar"
        role="search"
        aria-label="Find a journey"
      >
        <label className="tour-ideas-select">
          Search journeys
          <input
            value={search}
            onChange={(e) => {
              const next = new URLSearchParams(params)
              next.set('search', e.target.value)
              next.delete('page')
              setParams(next, { replace: true })
            }}
            placeholder="Name, destination or interest"
          />
        </label>
        {(params.get('minDays') || params.get('maxDays')) && (
          <p>
            Duration filter: {params.get('minDays') || '1'}–
            {params.get('maxDays') || 'any'} days{' '}
            <button onClick={() => setParams(search ? { search } : {})}>
              Clear duration
            </button>
          </p>
        )}
        <label className="tour-ideas-select">
          Choose your travel style
          <select
            value={category}
            onChange={(event) => {
              setCategory(event.target.value)
              const next = new URLSearchParams(params)
              next.delete('page')
              setParams(next, { replace: true })
            }}
          >
            {[
              'All interests',
              ...new Set(ideas.map((item) => item.category)),
            ].map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="journey-results-bar">
        <p role="status">
          {visible.length}{' '}
          {visible.length === 1 ? 'journey idea' : 'journey ideas'}
          {visible.length > PAGE_SIZE &&
            ` · Showing ${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, visible.length)}`}
        </p>
        {(search ||
          category !== 'All interests' ||
          params.get('minDays') ||
          params.get('maxDays')) && (
          <button
            className="filter-reset"
            onClick={() => {
              setParams({})
              setCategory('All interests')
            }}
          >
            Reset filters
          </button>
        )}
      </div>
      {!visible.length && (
        <p>
          No journeys match. Try another search or clear the duration filter.
        </p>
      )}
      <div className="destination-directory-grid">
        {pageIdeas.map((item) => (
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
              <p className="directory-region">{item.category}</p>
              <h3>{item.name}</h3>
              <p>{item.description}</p>
              {item.route?.length > 1 && (
                <div className="journey-card-facts">
                  <p>
                    {item.route.length} suggested days{' '}
                    <span>Flexible itinerary</span>
                  </p>
                  <p
                    className="journey-card-route"
                    aria-label="Suggested route"
                  >
                    {[...new Set(item.route)]
                      .map((place) =>
                        place
                          .split('-')
                          .map((word) => word[0].toUpperCase() + word.slice(1))
                          .join(' '),
                      )
                      .join(' → ')}
                  </p>
                </div>
              )}
              <Link className="directory-link" to={'/journeys/' + item.slug}>
                Explore this journey <span aria-hidden="true">↗</span>
              </Link>
            </div>
          </article>
        ))}
      </div>
      <Pagination
        page={page}
        totalPages={totalPages}
        onChange={changePage}
        name="Journey"
      />
    </section>
  )
}
