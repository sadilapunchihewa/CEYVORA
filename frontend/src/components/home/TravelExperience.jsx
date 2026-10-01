import SectionTitle from '../common/SectionTitle'
const experiences = [
  [
    'Culture',
    'Stories written in stone.',
    'sigiriya',
    'Sigiriya rock fortress surrounded by forest',
  ],
  [
    'Wildlife',
    'Make room for the wild.',
    'wildlife',
    'Elephants beside a river in Sri Lanka',
  ],
  [
    'Beaches',
    'Follow the ocean breeze.',
    'beach',
    'Palm trees along Hiriketiya Beach',
  ],
  [
    'Hill country',
    'A slower kind of morning.',
    'hills',
    'Tea harvesting in Sri Lanka’s hill country',
  ],
]
export default function TravelExperience() {
  return (
    <section className="section experiences">
      <div className="container">
        <SectionTitle
          title="Find your Sri Lanka"
          description="Follow your curiosity from the mountains to the sea."
        />
        <div className="experience-grid">
          {experiences.map(([title, text, image, alt], index) => (
            <figure key={title}>
              <img
                src={'/images/' + image + '.webp'}
                alt={alt}
                width="500"
                height="660"
                loading="lazy"
              />
              <figcaption>
                <span>{String(index + 1).padStart(2, '0')}</span>
                <h3>{title}</h3>
                <p>{text}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}
