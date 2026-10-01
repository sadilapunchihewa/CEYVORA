import { useEffect, useRef } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Navbar from './Navbar'
import Footer from './Footer'
export default function MainLayout() {
  const location = useLocation()
  const main = useRef(null)
  const previousPath = useRef(location.pathname)
  useEffect(() => {
    window.scrollTo(0, 0)
    if (previousPath.current !== location.pathname)
      main.current?.focus({ preventScroll: true })
    previousPath.current = location.pathname
    const titles = {
      '/': 'Ceyvora | Discover Sri Lanka',
      '/tours': 'Sri Lanka Tours | Ceyvora',
      '/destinations': 'Sri Lanka Destinations | Ceyvora',
      '/about': 'About Ceyvora',
      '/contact': 'Plan Your Sri Lanka Journey | Ceyvora',
      '/login': 'Login',
      '/register': 'Create an account',
      '/account': 'My account',
      '/account/profile': 'My profile',
      '/account/bookings': 'My bookings',
    }
    const title = titles[location.pathname]
    document.title = title
      ? title.includes('Ceyvora')
        ? title
        : `${title} | Ceyvora`
      : 'Explore Sri Lanka | Ceyvora'
  }, [location.pathname])
  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <Navbar key={location.pathname} />
      <main id="main-content" ref={main} tabIndex="-1">
        <Outlet />
      </main>
      <Footer />
    </>
  )
}
