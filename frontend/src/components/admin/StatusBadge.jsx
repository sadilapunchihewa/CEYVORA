export default function StatusBadge({ children, status = children }) {
  const key = String(status).toLowerCase().replace(/\s/g, '-')
  return (
    <span className={`status-badge status-${key}`}>
      <span aria-hidden="true" />
      {children}
    </span>
  )
}
