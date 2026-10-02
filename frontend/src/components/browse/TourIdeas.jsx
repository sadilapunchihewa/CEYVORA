import { useState } from 'react'
import { Link } from 'react-router-dom'
import ideas from '../../data/tourIdeas.json'
export default function TourIdeas() {
  const [category, setCategory] = useState('All interests')
  const visible = ideas.filter(
    (item) => category === 'All interests' || item.category === category,
  )
  return (
    <section
      id="tour-ideas"
      className="section container tour-ideas"
      aria-labelledby="tour-ideas-title"
    >
      <div className="directory-intro">
        <p>More ways to travel</p>
        <h2 id="tour-ideas-title">
          Start with an idea.
          <br />
          Make it your own.
        </h2>
        <p>
          These journey themes are starting points for a personalised enquiry.
          Tell us what appeals to you; routes, dates and prices are arranged
          during planning.
        </p>
      </div>
      <label className="tour-ideas-select">
        Choose your travel style
        <select
          value={category}
          onChange={(event) => setCategory(event.target.value)}
        >
          {[
            'All interests',
            ...new Set(ideas.map((item) => item.category)),
          ].map((value) => (
            <option key={value}>{value}</option>
          ))}
        </select>
      </label>
      <p role="status">
        {visible.length}{' '}
        {visible.length === 1 ? 'journey idea' : 'journey ideas'}
      </p>
      <div className="destination-directory-grid">
        {visible.map((item) => (
          <article className="destination-directory-card" key={item.slug}>
            <div className="experience-photo">
              <img
                src={item.image}
                alt={item.name}
                width="800"
                height="550"
                loading="lazy"
              />
            </div>
            <div className="directory-copy">
              <p className="directory-region">{item.category}</p>
              <h3>{item.name}</h3>
              <p>{item.description}</p>
              <Link className="directory-link" to={'/journeys/' + item.slug}>
                Explore this journey <span aria-hidden="true">↗</span>
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
