import { Link } from 'react-router-dom'
export default function SectionTitle({ title, description, to, linkLabel }) {
  return (
    <div className="section-title">
      <div>
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>
      {to && (
        <Link className="text-link" to={to}>
          {linkLabel}
        </Link>
      )}
    </div>
  )
}
