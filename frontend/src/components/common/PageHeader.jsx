export default function PageHeader({
  title,
  description,
  eyebrow = 'Sri Lanka, your way',
  image,
  imageAlt = '',
  className = '',
}) {
  return (
    <header
      className={`page-header${image ? ' page-header-visual' : ''}${className ? ` ${className}` : ''}`}
    >
      <div className="container page-header-layout">
        <div className="page-header-copy">
          <p>{eyebrow}</p>
          <h1>{title}</h1>
          <p className="page-description">{description}</p>
        </div>
        {image && (
          <figure className="page-header-image">
            <img src={image} alt={imageAlt} width="1000" height="1200" />
            <figcaption>{imageAlt}</figcaption>
          </figure>
        )}
      </div>
    </header>
  )
}
