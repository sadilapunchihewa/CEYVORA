export default function InnerPageHero({
  title,
  description,
  eyebrow,
  image,
  imageAlt,
  href,
  linkText,
}) {
  return (
    <header className="inner-page-hero">
      <img
        className="inner-page-hero-photo"
        src={image}
        alt={imageAlt}
        fetchPriority="high"
      />
      <div className="container inner-page-hero-copy">
        <p className="inner-page-hero-eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="inner-page-hero-description">{description}</p>
        <span className="inner-page-hero-rule" aria-hidden="true" />
        {href && (
          <a className="inner-page-hero-link" href={href}>
            {linkText}
            <span aria-hidden="true">↓</span>
          </a>
        )}
      </div>
    </header>
  )
}
