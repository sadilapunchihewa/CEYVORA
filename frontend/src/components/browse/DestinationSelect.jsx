import { useCallback, useState } from 'react'
import useResource from '../../hooks/useResource'
import {
  getDestinations,
  getDestinationById,
} from '../../services/destinationService'

export default function DestinationSelect({ value, onChange, error }) {
  const [draft, setDraft] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const load = useCallback(
    (signal) => getDestinations({ search, page, pageSize: 10 }, signal),
    [search, page],
  )
  const options = useResource(load)
  const loadSelected = useCallback(
    (signal) =>
      /^\d+$/.test(value)
        ? getDestinationById(value, signal)
        : Promise.resolve(null),
    [value],
  )
  const selected = useResource(loadSelected)
  const items = options.data?.items || []
  function find() {
    setSearch(draft.trim())
    setPage(1)
  }
  return (
    <div className="destination-select">
      <label htmlFor="destinationId">Destination</label>
      <select
        id="destinationId"
        name="destinationId"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? 'destinationId-error' : undefined}
      >
        <option value="">Any destination</option>
        {value && !items.some((item) => String(item.id) === value) && (
          <option value={value}>
            {selected.data?.name ||
              (selected.loading
                ? 'Loading selected destination…'
                : 'Selected destination unavailable')}
          </option>
        )}
        {items.map((item) => (
          <option key={item.id} value={item.id}>
            {item.name}
          </option>
        ))}
      </select>
      {error && (
        <p className="field-error" id="destinationId-error">
          {error}
        </p>
      )}
      <details className="destination-finder">
        <summary>Find more destinations</summary>
        <label htmlFor="destination-option-search">
          Find destination options
        </label>
        <div className="option-search">
          <input
            id="destination-option-search"
            maxLength="200"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                find()
              }
            }}
            placeholder="Destination name"
          />
          <button type="button" onClick={find}>
            Find
          </button>
        </div>
        {options.loading ? (
          <p role="status">Loading destination options…</p>
        ) : options.error ? (
          <div role="alert">
            <p>Destination options could not be loaded.</p>
            <button type="button" onClick={options.retry}>
              Retry options
            </button>
          </div>
        ) : (
          <>
            <p>
              {items.length
                ? 'Choose a result in the destination selector above.'
                : 'No destination options found. Try another name.'}
            </p>
            {options.data?.totalPages > 1 && (
              <div className="option-pages">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                >
                  Previous options
                </button>
                <span>
                  {page} / {options.data.totalPages}
                </span>
                <button
                  type="button"
                  disabled={page >= options.data.totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  Next options
                </button>
              </div>
            )}
          </>
        )}
      </details>
      {options.error && (
        <p className="field-error">
          Destination choices are unavailable. Open “Find more destinations” to
          retry.
        </p>
      )}
    </div>
  )
}
