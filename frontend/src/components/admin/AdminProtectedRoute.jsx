import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/authContextValue'
import LoadingSpinner from '../common/LoadingSpinner'
export default function AdminProtectedRoute() {
  const auth = useAuth()
  const location = useLocation()
  if (auth.loading)
    return (
      <div className="admin-gate">
        <LoadingSpinner label="Opening Ceyvora Admin…" />
      </div>
    )
  if (!auth.isAuthenticated)
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  if (auth.user?.role !== 'Admin')
    return (
      <div className="admin-denied" role="alert">
        <span>403</span>
        <h1>Access denied</h1>
        <p>You don't have permission to access this area.</p>
        <a className="button button-primary" href="/">
          Return to website
        </a>
      </div>
    )
  return <Outlet />
}
