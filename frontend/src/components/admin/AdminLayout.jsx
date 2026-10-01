import { useEffect, useState } from 'react'
import {
  NavLink,
  Outlet,
  Link,
  useLocation,
  useNavigate,
} from 'react-router-dom'
import { useAuth } from '../../context/authContextValue'
import { ToastProvider } from './Toast'
const links = [
  ['/admin', 'Dashboard', '⌂'],
  ['/admin/destinations', 'Destinations', '⌖'],
  ['/admin/tours', 'Tour packages', '◇'],
  ['/admin/bookings', 'Bookings', '▣'],
  ['/admin/enquiries', 'Enquiries', '✉'],
  ['/admin/reviews', 'Reviews', '★'],
]
export default function AdminLayout() {
  const [open, setOpen] = useState(false)
  const auth = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  useEffect(() => {
    const section = links.find(([to]) =>
      to === '/admin'
        ? location.pathname === to
        : location.pathname.startsWith(to),
    )?.[1]
    document.title = `${section || 'Admin'} | Ceyvora Admin`
  }, [location.pathname])
  const logout = () => {
    auth.logout()
    navigate('/')
  }
  return (
    <ToastProvider>
      <div className="admin-shell">
        <aside className={`admin-sidebar ${open ? 'is-open' : ''}`}>
          <div className="admin-brand">
            <strong>CEYVORA</strong>
            <span>Tourism operations</span>
          </div>
          <nav aria-label="Admin navigation">
            {links.map(([to, label, icon]) => (
              <NavLink
                key={to}
                end={to === '/admin'}
                to={to}
                onClick={() => setOpen(false)}
              >
                <span aria-hidden="true">{icon}</span>
                {label}
              </NavLink>
            ))}
          </nav>
          <div className="admin-sidebar-bottom">
            <Link to="/">↗ View website</Link>
            <button onClick={logout}>↪ Sign out</button>
          </div>
        </aside>
        {open && (
          <button
            className="admin-scrim"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          />
        )}
        <div className="admin-workspace">
          <header className="admin-header">
            <button
              className="admin-menu"
              onClick={() => setOpen(true)}
              aria-label="Open navigation"
            >
              ☰
            </button>
            <div>
              <span>Admin workspace</span>
              <strong>{auth.user?.fullName}</strong>
            </div>
          </header>
          <main className="admin-main" id="admin-main">
            <Outlet />
          </main>
        </div>
      </div>
    </ToastProvider>
  )
}
