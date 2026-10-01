import { useAuth } from '../../context/authContextValue'
export default function ProfilePage() {
  const { user } = useAuth()
  return (
    <>
      <h1>My profile</h1>
      <p className="customer-intro">
        The details you shared when you joined Ceyvora.
      </p>
      <dl className="customer-facts">
        {[
          ['Full name', user.fullName],
          ['Email', user.email],
          ['Phone', user.phone],
          ['Country', user.country],
        ].map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value || 'Not provided'}</dd>
          </div>
        ))}
      </dl>
      <p className="muted">
        Profile editing isn’t available yet. You can supply your current phone
        number and country with each travel request.
      </p>
    </>
  )
}
