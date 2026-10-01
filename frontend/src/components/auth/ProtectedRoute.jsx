import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/authContextValue'
import LoadingSpinner from '../common/LoadingSpinner'
import Button from '../common/Button'
export default function ProtectedRoute() {
  const auth = useAuth()
  const location = useLocation()
  if (auth.loading)
    return (
      <div className="customer-page container">
        <LoadingSpinner label="Opening your account…" />
      </div>
    )
  if (auth.token && auth.error)
    return (
      <div className="customer-page container" role="alert">
        <h1>We couldn’t load your account.</h1>
        <p>Check your connection and try again.</p>
        <Button onClick={auth.refreshUser}>Try again</Button>{' '}
        <Button variant="outline" onClick={auth.logout}>
          Sign out
        </Button>
      </div>
    )
  if (!auth.isAuthenticated)
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname + location.search }}
      />
    )
  return <Outlet />
}
