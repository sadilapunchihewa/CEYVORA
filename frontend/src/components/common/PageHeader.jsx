export default function PageHeader({
  title,
  description,
  eyebrow = 'Sri Lanka, your way',
  image,
  imageAlt = '',
  marker = 'CEYVORA',
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
          {image && <span className="page-header-marker">{marker}</span>}
        </div>
        {image && (
          <figure className="page-header-image">
            <img src={image} alt={imageAlt} width="1000" height="1200" />
            <figcaption>Island notes · 07° N, 81° E</figcaption>
          </figure>
        )}
      </div>
    </header>
  )
}
