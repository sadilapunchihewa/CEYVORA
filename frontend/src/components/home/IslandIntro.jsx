import { Link } from 'react-router-dom'

export default function IslandIntro() {
  return (
    <section className="island-welcome container" aria-labelledby="island-intro-title">
      <div className="island-welcome-copy">
        <p className="island-welcome-label"><span aria-hidden="true">✳</span> The pearl of the Indian Ocean</p>
        <h2 id="island-intro-title">One island.<br />A thousand stories.</h2>
        <p className="island-welcome-description">
          Ancient kingdoms, misty tea country and a coastline made for slow days.
          Find the Sri Lanka that feels like yours.
        </p>
        <Link className="button button-primary island-welcome-cta" to="/destinations">
          Explore the island <span aria-hidden="true">↗</span>
        </Link>
      </div>

      <figure className="island-welcome-photo">
        <img
          src="/images/destinations/hatton.jpg"
          alt="Golden sunrise over the green, mist-covered hills of Hatton"
          width="1667"
          height="1146"
          loading="lazy"
        />
        <figcaption>
          <span>01 / Hill country</span>
          <strong>Take the scenic way.</strong>
          <Link to="/destinations/hatton" aria-label="Discover Hatton">Discover Hatton <span aria-hidden="true">↗</span></Link>
        </figcaption>
        <span className="island-welcome-stamp" aria-hidden="true">Your<br />island<br />story</span>
      </figure>

      <nav className="island-welcome-places" aria-label="Choose your kind of escape">
        <Link to="/destinations/sigiriya" className="island-place-card">
          <img src="/images/destinations/sigiriya.jpg" alt="" loading="lazy" />
          <span className="island-place-copy"><span>Culture &amp; heritage</span><strong>Walk through history</strong></span>
          <span className="island-place-arrow" aria-hidden="true">↗</span>
        </Link>
        <Link to="/destinations/ella" className="island-place-card">
          <img src="/images/destinations/ella.jpg" alt="" loading="lazy" />
          <span className="island-place-copy"><span>Tea country</span><strong>Find your highland calm</strong></span>
          <span className="island-place-arrow" aria-hidden="true">↗</span>
        </Link>
        <Link to="/destinations/mirissa" className="island-place-card">
          <img src="/images/destinations/mirissa.jpg" alt="" loading="lazy" />
          <span className="island-place-copy"><span>South coast</span><strong>Follow the sea breeze</strong></span>
          <span className="island-place-arrow" aria-hidden="true">↗</span>
        </Link>
      </nav>
    </section>
  )
}
