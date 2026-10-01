import { useRef, useState } from 'react'
import Button from '../common/Button'
import DestinationSelect from './DestinationSelect'
import { cleanParams, readBrowseParams, sortOptions } from '../../utils/query'

export default function BrowseFilters({ params, tours, onApply, onClear }) {
  const [errors, setErrors] = useState({})
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [destinationId, setDestinationId] = useState(
    params.get('destinationId') || '',
  )
  const form = useRef(null)
  function submit(event) {
    event.preventDefault()
    const values = new URLSearchParams(new FormData(event.currentTarget))
    values.set('page', '1')
    const parsed = readBrowseParams(values, tours)
    setErrors(parsed.errors)
    if (Object.keys(parsed.errors).length) {
      requestAnimationFrame(() =>
        form.current?.elements
          .namedItem(Object.keys(parsed.errors)[0])
          ?.focus(),
      )
      return
    }
    onApply(new URLSearchParams(cleanParams(parsed.query)))
  }
  function input(name, label, props = {}) {
    return (
      <div className="field" key={name}>
        <label htmlFor={name}>{label}</label>
        <input
          id={name}
          name={name}
          defaultValue={params.get(name) || ''}
          {...props}
          aria-invalid={Boolean(errors[name])}
          aria-describedby={errors[name] ? name + '-error' : undefined}
        />
        {errors[name] && (
          <p className="field-error" id={name + '-error'}>
            {errors[name]}
          </p>
        )}
      </div>
    )
  }
  function applyQuick(minDays, maxDays, featured) {
    const next = new URLSearchParams(params)
    next.delete('minDays')
    next.delete('maxDays')
    next.delete('featured')
    if (minDays) next.set('minDays', minDays)
    if (maxDays) next.set('maxDays', maxDays)
    if (featured) next.set('featured', featured)
    next.set('page', '1')
    onApply(next)
  }
  if (!tours) {
    return (
      <form
        className="browse-filters destination-explorer"
        ref={form}
        onSubmit={submit}
        aria-label="Destination search and filters"
        noValidate
      >
        <div className="destination-explorer-heading">
          <span>Find your place</span>
          <p>Search by name or narrow the island by region.</p>
        </div>
        <div className="destination-explorer-fields">
          {input('search', 'Destination', {
            type: 'search',
            maxLength: 200,
            placeholder: 'Where would you like to go?',
          })}
          {input('province', 'Province', {
            maxLength: 100,
            placeholder: 'Any province',
          })}
          {input('district', 'District', {
            maxLength: 100,
            placeholder: 'Any district',
          })}
          <div className="field">
            <label htmlFor="featured">Collection</label>
            <select
              id="featured"
              name="featured"
              defaultValue={params.get('featured') || ''}
            >
              <option value="">All places</option>
              <option value="true">Ceyvora highlights</option>
              <option value="false">More to discover</option>
            </select>
          </div>
          <input type="hidden" name="pageSize" value="6" />
        </div>
        {Object.keys(errors).length > 0 && (
          <p role="alert" className="field-error">
            Check the highlighted filters before searching.
          </p>
        )}
        <div className="destination-explorer-actions">
          <Button type="submit">Explore places</Button>
          <button type="button" className="text-action" onClick={onClear}>
            Reset
          </button>
        </div>
      </form>
    )
  }
  const quickFilter =
    params.get('featured') === 'true'
      ? 'featured'
      : params.get('minDays') === '3' && params.get('maxDays') === '5'
        ? '3-5'
        : params.get('minDays') === '6' && params.get('maxDays') === '10'
          ? '6-10'
          : params.get('minDays') === '11' && !params.get('maxDays')
            ? '10+'
            : 'all'
  return (
    <form
      className="browse-filters journey-explorer"
      ref={form}
      onSubmit={submit}
      aria-label="Tour search and filters"
      noValidate
    >
      <div className="journey-search-row">
        <div className="journey-search-field">
          <label htmlFor="search">Where do you want to go?</label>
          <div>
            <input
              id="search"
              name="search"
              type="search"
              maxLength="200"
              defaultValue={params.get('search') || ''}
              placeholder="Search journeys, places and experiences…"
            />
            <button type="submit" aria-label="Search journeys">
              ↗
            </button>
          </div>
        </div>
        <div className="journey-sort-field field">
          <label htmlFor="sort">Sort by</label>
          <select
            id="sort"
            name="sort"
            defaultValue={params.get('sort') || 'newest'}
            onChange={(event) => {
              const next = new URLSearchParams(params)
              next.set('sort', event.target.value)
              next.set('page', '1')
              onApply(next)
            }}
          >
            {sortOptions.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="journey-filter-bar">
        <div className="quick-filters" aria-label="Quick filters">
          {[
            ['all', 'All journeys', '', '', ''],
            ['3-5', '3–5 days', '3', '5', ''],
            ['6-10', '6–10 days', '6', '10', ''],
            ['10+', '10+ days', '11', '', ''],
            ['featured', 'Featured', '', '', 'true'],
          ].map(([key, label, min, max, featured]) => (
            <button
              type="button"
              key={key}
              aria-pressed={quickFilter === key}
              onClick={() => applyQuick(min, max, featured)}
            >
              {label}
            </button>
          ))}
        </div>
        <button
          className="advanced-filter-toggle"
          type="button"
          aria-expanded={advancedOpen}
          aria-controls="advanced-tour-filters"
          onClick={() => setAdvancedOpen((open) => !open)}
        >
          Filters {advancedOpen ? '−' : '+'}
        </button>
      </div>
      <div
        id="advanced-tour-filters"
        className={`advanced-tour-filters${advancedOpen ? ' is-open' : ''}`}
        hidden={!advancedOpen}
      >
        <div className="advanced-filter-heading">
          <span>Refine the journey</span>
          <button type="button" onClick={() => setAdvancedOpen(false)}>
            Close ×
          </button>
        </div>
        <div className="advanced-filter-grid">
          <DestinationSelect
            value={destinationId}
            onChange={setDestinationId}
            error={errors.destinationId}
          />
          <div className="range-fields">
            {input('minPrice', 'Min price', {
              type: 'number',
              min: 0,
              max: 100000000,
              step: 'any',
              placeholder: 'No minimum',
            })}
            {input('maxPrice', 'Max price', {
              type: 'number',
              min: 0,
              max: 100000000,
              step: 'any',
              placeholder: 'No maximum',
            })}
          </div>
          <div className="range-fields">
            {input('minDays', 'Min days', {
              type: 'number',
              min: 1,
              max: 365,
              step: 1,
              placeholder: '1',
            })}
            {input('maxDays', 'Max days', {
              type: 'number',
              min: 1,
              max: 365,
              step: 1,
              placeholder: '365',
            })}
          </div>
          <div className="field">
            <label htmlFor="featured">Featured</label>
            <select
              id="featured"
              name="featured"
              defaultValue={params.get('featured') || ''}
            >
              <option value="">All journeys</option>
              <option value="true">Featured only</option>
              <option value="false">More journeys</option>
            </select>
          </div>
          <div className="field page-size-filter">
            <label htmlFor="pageSize">Results per page</label>
            <select
              name="pageSize"
              id="pageSize"
              defaultValue={params.get('pageSize') || '6'}
            >
              {[6, 12, 24, 48].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
        </div>
        {Object.keys(errors).length > 0 && (
          <p role="alert" className="field-error">
            Check the highlighted filters before searching.
          </p>
        )}
        <div className="advanced-filter-actions">
          <Button type="submit">Apply filters</Button>
          <button type="button" className="text-action" onClick={onClear}>
            Clear all
          </button>
        </div>
      </div>
    </form>
  )
}
