import { useState } from 'react'
import { Link } from 'react-router-dom'
const experiences = [
  {
    name: 'Culture & heritage',
    image: 'sigiriya',
    title: 'Walk into another chapter.',
    description:
      'Build your days around ancient cities, temple courtyards and the stories behind the places you visit. Leave space for a market stop and a meal along the way.',
    places: ['Sigiriya', 'Kandy', 'Galle'],
    search: 'culture',
    note: 'For curious travellers and first visits',
  },
  {
    name: 'Wildlife & nature',
    image: 'wildlife',
    title: 'Let the wild set the pace.',
    description:
      'Make nature the centre of your route. Pair time in the wilderness with quieter surroundings, and discuss the park visits and guiding options that suit your trip.',
    places: ['Yala', 'Udawalawe', 'Sinharaja'],
    search: 'wildlife',
    note: 'For nature lovers and time outdoors',
  },
  {
    name: 'Coast & beaches',
    image: 'south-coast',
    title: 'A few days with no hurry.',
    description:
      'Finish a busy journey beside the ocean, or make the coast your whole escape. Tell us whether you prefer a lively beach town or a quieter place to unwind.',
    places: ['Tangalle', 'Mirissa', 'Galle'],
    search: 'coast',
    note: 'For slow mornings and seaside stays',
  },
  {
    name: 'Hills & tea country',
    image: 'ella-train',
    title: 'Take the scenic way.',
    description:
      'Follow your curiosity into the hills. Bring together tea country, walking time and a rail journey where available, with enough room to enjoy the views between stops.',
    places: ['Ella', 'Nuwara Eliya', 'Kandy'],
    search: 'hill',
    note: 'For scenic journeys and fresh perspectives',
  },
]
export default function TravelExperience() {
  const [selected, setSelected] = useState(0)
  const experience = experiences[selected]
  return (
    <section
      className="experience-discovery section"
      id="experiences"
      aria-labelledby="experience-title"
    >
      <div className="container">
        <div className="discovery-heading">
          <div>
            <p>What brings you here?</p>
            <h2 id="experience-title">An island. Your kind of escape.</h2>
          </div>
          <p>
            Start with what you love. Find the places and journeys that bring it
            to life.
          </p>
        </div>
        <div className="experience-options" aria-label="Choose an experience">
          {experiences.map((item, index) => (
            <button
              key={item.name}
              type="button"
              aria-pressed={selected === index}
              aria-controls="experience-panel"
              onClick={() => setSelected(index)}
            >
              {item.name}
            </button>
          ))}
        </div>
        <div className="experience-panel" id="experience-panel">
          <img
            src={'/images/' + experience.image + '.webp'}
            alt={experience.name + ' in Sri Lanka'}
            width="1000"
            height="760"
            loading="lazy"
          />
          <div className="experience-panel-copy" aria-live="polite">
            <p className="experience-note">{experience.note}</p>
            <h3>{experience.title}</h3>
            <p>{experience.description}</p>
            <h4>Places to explore</h4>
            <div className="experience-places">
              {experience.places.map((place) => (
                <Link
                  key={place}
                  to={'/destinations?search=' + encodeURIComponent(place)}
                >
                  {place}
                </Link>
              ))}
            </div>
            <Link
              className="button button-primary"
              to={'/tours?search=' + experience.search}
            >
              Explore {experience.name.toLowerCase()}
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
