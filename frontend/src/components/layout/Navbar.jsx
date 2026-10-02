import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/authContextValue'
import Button from '../common/Button'
export default function Navbar() {
  const { isAuthenticated, loading, logout } = useAuth()
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(window.scrollY > 30)
  const toggle = useRef(null)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30)
    const onKey = (e) => {
      if (e.key === 'Escape' && open) {
        setOpen(false)
        toggle.current?.focus()
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('keydown', onKey)
    }
  }, [open])
  useEffect(() => {
    document.body.classList.toggle('mobile-menu-open', open)
    return () => document.body.classList.remove('mobile-menu-open')
  }, [open])
  return (
    <header
      className={
        'site-header ' +
        ([
          '/',
          '/tours',
          '/destinations',
          '/experiences',
          '/about',
          '/contact',
        ].includes(pathname) &&
        !scrolled &&
        !open
          ? 'is-overlay'
          : 'is-solid')
      }
    >
      <div className="container nav-shell">
        <div className="nav-row">
          <p className="nav-kicker">Curated island journeys</p>
          <Link to="/" className="brand" aria-label="Ceyvora home">
            CEYVORA<span>Sri Lanka, your way</span>
          </Link>
          <div className="nav-actions">
            {!loading && isAuthenticated ? (
              <>
                <NavLink to="/account">My account</NavLink>
                <button
                  className="nav-text-action"
                  type="button"
                  onClick={logout}
                >
                  Logout
                </button>
              </>
            ) : (
              !loading && <NavLink to="/login">Login</NavLink>
            )}
            <Button to="/contact" variant="sand">
              Plan your trip
            </Button>
          </div>
        </div>
        <button
          type="button"
          ref={toggle}
          className="menu-toggle"
          aria-expanded={open}
          aria-controls="main-navigation"
          onClick={() => setOpen(!open)}
        >
          {open ? 'Close' : 'Menu'}
          <span aria-hidden="true">{open ? '×' : '☰'}</span>
        </button>
        <nav
          id="main-navigation"
          aria-label="Main navigation"
          className={open ? 'navigation is-open' : 'navigation'}
        >
          {[
            ['/', 'Home'],
            ['/destinations', 'Destinations'],
            ['/tours', 'Tours'],
            ['/experiences', 'Experiences'],
            ['/about', 'About'],
            ['/contact', 'Contact'],
          ].map(([to, text]) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={() => setOpen(false)}
            >
              {text}
            </NavLink>
          ))}
          <div className="mobile-nav-actions">
            {isAuthenticated ? (
              <>
                <NavLink to="/account" onClick={() => setOpen(false)}>
                  My account
                </NavLink>
                <Button
                  variant="sand"
                  onClick={() => {
                    logout()
                    setOpen(false)
                  }}
                >
                  Logout
                </Button>
              </>
            ) : loading ? (
              <span>Opening account…</span>
            ) : (
              <>
                <NavLink to="/login" onClick={() => setOpen(false)}>
                  Login
                </NavLink>
                <Button
                  to="/contact"
                  variant="sand"
                  onClick={() => setOpen(false)}
                >
                  Plan your trip
                </Button>
              </>
            )}
          </div>
        </nav>
      </div>
    </header>
  )
}
