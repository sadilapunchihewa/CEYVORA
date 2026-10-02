import { Link } from 'react-router-dom'
export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div>
          <Link to="/" className="brand">
            CEYVORA<span>Sri Lanka, your way</span>
          </Link>
          <p>
            From forest trails to the Indian Ocean.
            <br />
            Find the Sri Lanka that stays with you.
          </p>
        </div>
        <div>
          <h2>Explore</h2>
          <Link to="/destinations">Destinations</Link>
          <Link to="/tours">Tours</Link>
          <Link to="/about">About Ceyvora</Link>
            <Link to="/experiences">Experiences</Link>
            <Link to="/ai-planner">AI journey planner</Link>
        </div>
        <div>
          <h2>Let’s plan</h2>
          <Link to="/contact">Contact us</Link>
          <Link to="/faq">Travel FAQ</Link>
          <Link to="/contact">Plan your trip</Link>
        </div>
      </div>
      <div className="container footer-statement">
        Sri Lanka,
        <br />
        beyond the ordinary.
      </div>
      <div className="container footer-bottom">
        <small>© {new Date().getFullYear()} Ceyvora</small>
        <span>Made for a more thoughtful journey.</span>
      </div>
    </footer>
  )
}
