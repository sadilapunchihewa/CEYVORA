import Button from '../common/Button'
export default function AdminPageHeader({ title, description, action, to }) {
  return (
    <div className="admin-page-head">
      <div>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {action && <Button to={to}>{action}</Button>}
    </div>
  )
}
