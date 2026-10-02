import useWebsiteContent from '../../hooks/useWebsiteContent'
export default function BusinessDetails() {
  const { items } = useWebsiteContent('business')
  const business = items[0]
  if (!business) return null
  const safeWeb = (value) => {
    try {
      const url = new URL(value)
      return ['https:', 'http:'].includes(url.protocol) ? url.href : null
    } catch {
      return null
    }
  }
  return (
    <div className="business-details">
      {business.email && (
        <p>
          <a href={'mailto:' + encodeURIComponent(business.email)}>
            {business.email}
          </a>
        </p>
      )}
      {business.phone && (
        <p>
          <a href={'tel:' + business.phone.replace(/[^+\d]/g, '')}>
            {business.phone}
          </a>
        </p>
      )}
      {business.whatsapp && (
        <p>
          <a
            href={'https://wa.me/' + business.whatsapp.replace(/\D/g, '')}
            target="_blank"
            rel="noreferrer"
          >
            Chat on WhatsApp ↗
          </a>
        </p>
      )}
      {business.address && <p>{business.address}</p>}
      {['instagram', 'facebook'].map(
        (key) =>
          safeWeb(business[key]) && (
            <p key={key}>
              <a href={safeWeb(business[key])} target="_blank" rel="noreferrer">
                {key} ↗
              </a>
            </p>
          ),
      )}
    </div>
  )
}
