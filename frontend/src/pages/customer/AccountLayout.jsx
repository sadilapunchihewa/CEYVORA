import { NavLink, Outlet } from 'react-router-dom'
export default function AccountLayout() {
  return (
    <div className="container customer-page account-layout">
      <nav className="account-navigation" aria-label="Your account">
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
