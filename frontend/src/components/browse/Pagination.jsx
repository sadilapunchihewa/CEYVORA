import Button from '../common/Button'
export default function Pagination({ page, totalPages, onChange, name }) {
  if (totalPages <= 1) return null
  const start = Math.max(1, Math.min(page - 2, totalPages - 4))
  const pages = Array.from(
    { length: Math.min(totalPages, 5) },
    (_, i) => start + i,
  )
  return (
    <nav className="pagination browse-pagination" aria-label={name + ' pages'}>
      <Button
        variant="outline"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
      >
        Previous
      </Button>
      <div className="page-numbers">
        {pages.map((value) => (
          <button
            key={value}
            aria-label={'Page ' + value}
            aria-current={value === page ? 'page' : undefined}
            onClick={() => onChange(value)}
          >
            {value}
          </button>
        ))}
      </div>
      <span className="page-position" aria-live="polite">
        Page {page} of {totalPages}
      </span>
      <Button
        variant="outline"
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
      >
        Next
      </Button>
    </nav>
  )
}
