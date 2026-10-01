const benefits = [
  [
    'Journeys shaped around you',
    'Start with your interests, your pace and the places you want to see.',
    'M4 18L10 6l4 12 6-8M4 18h16',
  ],
  [
    'A local perspective',
    'Make space for the food, traditions and everyday moments along the way.',
    'M12 21s7-7 7-12a7 7 0 10-14 0c0 5 7 12 7 12z M9 9a3 3 0 106 0 3 3 0 10-6 0',
  ],
  [
    'Thoughtful experiences',
    'Balance the well-known sights with time to slow down and explore.',
    'M4 18C4 5 12 4 20 4c0 12-5 16-16 14z M4 20L16 8',
  ],
  [
    'A conversation, from the start',
    'Tell us what matters to you. Ask questions as your plans take shape.',
    'M4 4h16v12H9l-5 4z M8 8h8 M8 12h5',
  ],
]
export default function WhyChooseUs() {
  return (
    <section className="section container why-section">
      <h2>Good journeys begin with care.</h2>
      <div className="benefits">
        {benefits.map(([title, text, path]) => (
          <div key={title}>
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d={path} />
            </svg>
            <h3>{title}</h3>
            <p>{text}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
