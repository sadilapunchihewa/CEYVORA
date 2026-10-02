import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/authContextValue'
export default function AccountLayout() {
  const { user } = useAuth()
  return (
    <div className="container customer-page account-layout">
      <nav className="account-navigation" aria-label="Your account">
        {user?.role === 'Admin' && (
          <NavLink to="/admin">Admin dashboard</NavLink>
        )}
        <NavLink end to="/account">
          My account
        </NavLink>
        <NavLink to="/account/profile">My profile</NavLink>
        <NavLink to="/account/bookings">My bookings</NavLink>
      </nav>
      <div className="account-content">
        <Outlet />
      </div>
    </div>
  )
}
