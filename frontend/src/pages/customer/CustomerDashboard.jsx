import { Link } from 'react-router-dom'
import { useAuth } from '../../context/authContextValue'
export default function CustomerDashboard() {
  const { user } = useAuth()
  return (
    <>
      <h1>Welcome back, {user.fullName.split(' ')[0]}</h1>
      <p className="customer-intro">
        A place for your plans, from the first idea to your next Sri Lankan
        journey.
      </p>
      <div className="account-links">
        {[
          [
            '/account/profile',
            'My profile',
            'Your contact details, all in one place.',
          ],
          [
            '/account/bookings',
            'My bookings',
            'Follow your travel requests and journey details.',
          ],
          ['/tours', 'Explore tours', 'Find the journey that feels like you.'],
        ].map(([to, title, description]) => (
          <Link to={to} key={to}>
            <h2>{title}</h2>
            <p>{description}</p>
          </Link>
        ))}
      </div>
      <img
        className="account-landscape"
        src="/images/beach.webp"
        alt="Hiriketiya Beach, Sri Lanka"
        loading="lazy"
      />
    </>
  )
}
