import LoadingSpinner from '../common/LoadingSpinner'
import Button from '../common/Button'
export default function DetailState({ resource, kind, to, children }) {
  if (resource.loading)
    return (
      <div className="container detail-state">
        <h1>Discover your next {kind}.</h1>
        <LoadingSpinner label={'Loading ' + kind + '…'} />
      </div>
    )
  if (resource.error)
    return (
      <section className="container detail-state">
        <h1>
          {resource.status === 404
            ? 'We couldn’t find this ' + kind + '.'
            : 'This ' + kind + ' could not be loaded.'}
        </h1>
        <p>
          {resource.status === 404
            ? 'It may no longer be available. Explore the current collection to find somewhere new.'
            : 'Please check your connection and try again.'}
        </p>
        <div className="button-row">
          {resource.status !== 404 && (
            <Button onClick={resource.retry}>Try again</Button>
          )}
          <Button to={to} variant="outline">
            Back to {kind === 'journey' ? 'tours' : 'destinations'}
          </Button>
        </div>
      </section>
    )
  return children
}
