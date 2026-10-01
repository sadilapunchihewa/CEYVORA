import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import useResource from '../hooks/useResource'
import ResourceState from '../components/common/ResourceState'
import PageHeader from '../components/common/PageHeader'
import Button from '../components/common/Button'
import BrowseFilters from '../components/browse/BrowseFilters'
import Pagination from '../components/browse/Pagination'
import { DestinationCard, TourCard } from '../components/common/TravelCard'
import { getDestinations } from '../services/destinationService'
import { getTourPackages } from '../services/tourPackageService'
import { readBrowseParams } from '../utils/query'

export default function ListingPage({ type }) {
  const [params, setParams] = useSearchParams()
  const [resetVersion, setResetVersion] = useState(0)
  const tours = type === 'tours'
  const { query, errors } = readBrowseParams(params, tours)
  const queryKey = JSON.stringify(query)
  const invalid = Object.keys(errors).length > 0
  const loader = useCallback(
    (signal) =>
      invalid
        ? Promise.resolve(null)
        : (tours ? getTourPackages : getDestinations)(
            JSON.parse(queryKey),
            signal,
          ),
    [tours, queryKey, invalid],
  )
  const resource = useResource(loader)
  const results = useRef(null)
  const previousQuery = useRef(params.toString())
  const searchKey = params.toString()
  useEffect(() => {
    if (previousQuery.current !== searchKey) {
      results.current?.scrollIntoView({ block: 'start' })
      results.current?.focus({ preventScroll: true })
    }
    previousQuery.current = searchKey
  }, [searchKey])
  const clear = () => {
    setResetVersion((value) => value + 1)
    setParams({})
  }
  const changePage = (next) => {
    const updated = new URLSearchParams(params)
    updated.set('page', String(next))
    setParams(updated)
  }
  const Card = tours ? TourCard : DestinationCard
  const empty =
    !resource.loading && !resource.error && !resource.data?.items?.length
  return (
    <>
      <PageHeader
        title={
          tours ? 'Find your way through Sri Lanka.' : 'Discover Sri Lanka'
        }
        description={
          tours
            ? 'Slow journeys through ancient cities, tea country, wilderness and coast.'
            : 'From ancient cities to quiet shores, discover where your curiosity leads.'
        }
        eyebrow={tours ? 'Journeys / 02' : 'Places worth the journey'}
        image={tours ? '/images/tea-country.webp' : '/images/galle-fort.webp'}
        imageAlt={
          tours
            ? 'Tea fields rolling across the hills of Nuwara Eliya'
            : 'The historic Galle Fort rising above Sri Lanka’s southern coast'
        }
        marker={tours ? '07° N — 81° E · ISLAND ROUTES' : 'PLACES · 02'}
        className={tours ? 'tours-page-header' : 'destination-page-header'}
      />
      <section className={`section container listing-section listing-${type}`}>
        {!tours && (
          <div className="destination-index-intro">
            <p>THE ISLAND DIRECTORY</p>
            <h2>Choose a place. Follow its story.</h2>
            <span>Culture · Hills · Wild · Coast</span>
          </div>
        )}
        <BrowseFilters
          key={type + searchKey + ':' + resetVersion}
          params={params}
          tours={tours}
          onApply={setParams}
          onClear={clear}
        />
        <div
          ref={results}
          tabIndex="-1"
          className="browse-results"
          aria-label="Search results"
        >
          {invalid ? (
            <div className="resource-state" role="alert">
              <h2>Check your search filters</h2>
              <ul>
                {Object.entries(errors).map(([key, message]) => (
                  <li key={key}>{message}</li>
                ))}
              </ul>
              <Button onClick={clear}>Clear filters</Button>
            </div>
          ) : (
            <ResourceState resource={resource} name={type}>
              {empty ? (
                <div className="resource-state">
                  <h2>
                    {tours ? 'No journeys found' : 'No destinations found.'}
                  </h2>
                  <p>
                    {tours
                      ? "We couldn't find a journey matching those filters."
                      : 'Try a different search or clear your filters to explore more.'}
                  </p>
                  <div className="button-row">
                    <Button variant="outline" onClick={clear}>
                      {tours ? 'Clear filters →' : 'Clear filters'}
                    </Button>
                    {query.page > 1 && (
                      <Button onClick={() => changePage(1)}>
                        Back to first page
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                resource.data && (
                  <>
                    <p className="result-count" role="status">
                      {resource.data.totalItems}{' '}
                      {tours
                        ? resource.data.totalItems === 1
                          ? 'journey'
                          : 'journeys'
                        : 'destinations'}
                      {query.search ? ' for “' + query.search + '”' : ''}
                    </p>
                    <div
                      className={
                        tours ? 'tour-grid' : 'destination-grid listing-grid'
                      }
                    >
                      {resource.data.items.map((item, index) => (
                        <Card
                          key={item.id}
                          item={item}
                          index={index}
                          variant={tours ? 'editorial' : undefined}
                        />
                      ))}
                    </div>
                  </>
                )
              )}
            </ResourceState>
          )}
          {!invalid && resource.data?.items?.length > 0 && (
            <Pagination
              page={resource.data.page}
              totalPages={resource.data.totalPages}
              onChange={changePage}
              name={type}
            />
          )}
        </div>
      </section>
    </>
  )
}
