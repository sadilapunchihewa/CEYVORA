import LoadingSpinner from './LoadingSpinner'
import Button from './Button'
export default function ResourceState({ resource, name, empty, children }) {
  if (resource.loading)
    return <LoadingSpinner label={'Loading ' + name + '…'} />
  if (resource.error)
    return (
      <div className="resource-state" role="alert">
        <h3>Unable to load {name} right now.</h3>
        <p>Please check your connection and try again.</p>
        <Button onClick={resource.retry} variant="outline">
          Try again
        </Button>
      </div>
    )
  if (empty)
    return (
      <div className="resource-state">
        <h3>No {name} to show yet.</h3>
        <p>Check back soon, or contact us to discuss your trip.</p>
      </div>
    )
  return children
}
