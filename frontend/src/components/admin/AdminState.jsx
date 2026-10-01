export default function AdminState({ loading, error, empty, children }) {
  if (loading)
    return (
      <div className="admin-state">
        <span className="spinner" />
        Loading…
      </div>
    )
  if (error)
    return (
      <div className="admin-state error" role="alert">
        {error}
      </div>
    )
  if (empty) return <div className="admin-state">{empty}</div>
  return children
}
