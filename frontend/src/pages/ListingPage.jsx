import InnerPageHero from '../components/common/InnerPageHero'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import useResource from '../hooks/useResource'
import ResourceState from '../components/common/ResourceState'
import Button from '../components/common/Button'
import BrowseFilters from '../components/browse/BrowseFilters'
import Pagination from '../components/browse/Pagination'
import { DestinationCard, TourCard } from '../components/common/TravelCard'
import { getDestinations } from '../services/destinationService'
import { getTourPackages } from '../services/tourPackageService'
import { readBrowseParams } from '../utils/query'
import { Link } from 'react-router-dom'
import CTASection from '../components/home/CTASection'
import TourIdeas from '../components/browse/TourIdeas'

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
      {!tours ? (
        <InnerPageHero
          eyebrow="Sri Lanka, beyond the familiar"
          title="An island of endless discovery."
          description="From mist-covered mountains to the edge of the Indian Ocean."
          image="/images/destinations/hatton.jpg"
          imageAlt="Sunrise illuminating layers of misty mountains around Hatton"
          href="#destination-directory"
          linkText="Find your next destination"
        />
      ) : (
        <header className="destination-directory-hero tours-directory-hero">
          <img
            src="/images/ella-train.webp"
            alt="A train winding through Sri Lanka’s hill country"
            fetchPriority="high"
          />
          <div className="container">
            <p>Travel at your own pace</p>
            <h1>
              Your next chapter,
              <br />
              written across the island.
            </h1>
            <a href="#destination-directory" className="button button-sand">
              Find your journey
            </a>
          </div>
        </header>
      )}
      <section
        id="destination-directory"
        className={`section container listing-section listing-${type}`}
      >
        {tours && (
          <div className="directory-intro">
            <nav aria-label="Breadcrumb">
              <Link to="/">Home</Link> / Tours
            </nav>
            <p>Go where your curiosity takes you</p>
            <h2>Find your journey.</h2>
            <p>
              From heritage trails to hill-country escapes, choose a route that
              fits your interests and the time you have. Explore the journey
              details or start a conversation about a trip of your own.
            </p>
            <Link className="text-link" to="/experiences">
              Discover things to do in Sri Lanka
            </Link>
          </div>
        )}
        {!tours && (
          <div className="directory-intro">
            <nav aria-label="Breadcrumb">
              <Link to="/">Home</Link>
              <span aria-hidden="true"> / </span>
              <span>Destinations</span>
            </nav>
            <p>Find the places that stay with you</p>
            <h2>
              A different discovery
              <br />
              in every direction.
            </h2>
            <p>
              Ancient cities and ocean towns. Tea-covered hills and paths
              through the wild. Explore the island one place at a time, then
              bring your favourites together into a journey that feels like you.
            </p>
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
                        : resource.data.totalItems === 1
                          ? 'destination'
                          : 'destinations'}
                      {query.search ? ' for “' + query.search + '”' : ''}
                    </p>
                    <div
                      className={
                        tours
                          ? 'tour-directory-grid'
                          : 'destination-directory-grid'
                      }
                    >
                      {resource.data.items.map((item, index) => (
                        <Card
                          key={item.id}
                          item={item}
                          index={index}
                          variant="directory"
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
      {tours && <TourIdeas />}
      <CTASection />
    </>
  )
}
