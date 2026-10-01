import { useState } from 'react'
import { resolveImageUrl } from '../../utils/images'
export default function TravelImage({
  path,
  alt,
  eager = false,
  collection = 'places',
}) {
  const url = resolveImageUrl(path)
  const [failedUrl, setFailedUrl] = useState(null)
  const available = url && failedUrl !== url
  // Editorial fallbacks are explicitly labelled; they are not API destination photos.
  const placesTheme = /ella|nuwara|hill/i.test(alt)
    ? 'tea-country'
    : /galle|beach|mirissa|coast/i.test(alt)
      ? 'galle-lighthouse'
      : /kandy|temple|culture/i.test(alt)
        ? 'kandy-temple'
        : /colombo/i.test(alt)
          ? 'colombo-market'
          : 'galle-fort'
  const journeysTheme = /tea|ella|nuwara|hill/i.test(alt)
    ? 'tea-picker'
    : /city|colombo|market/i.test(alt)
      ? 'colombo-lake'
      : /coast|galle|beach|classic/i.test(alt)
        ? 'fort-walk'
        : 'colombo-market'
  const theme = collection === 'journeys' ? journeysTheme : placesTheme
  const descriptions = {
    'tea-country': 'Tea fields across the hills of Nuwara Eliya',
    'galle-lighthouse': 'Galle Lighthouse above tropical palm trees',
    'kandy-temple': 'A hilltop temple in Kandy',
    'colombo-market': 'A lively street in Colombo',
    'tea-picker': 'Tea harvesting in Sri Lanka',
    'colombo-lake': 'A quiet tropical lake in Colombo',
    'fort-walk': 'Travellers walking along Galle Fort',
    'galle-fort': 'The historic Galle Fort',
  }
  return (
    <div className="travel-image">
      <img
        src={available ? url : '/images/' + theme + '.webp'}
        alt={
          available
            ? alt
            : descriptions[theme] +
              ' — illustrative image, not a tour or destination photo'
        }
        loading={eager ? 'eager' : 'lazy'}
        fetchPriority={eager ? 'high' : undefined}
        width="640"
        height="440"
        onError={() => {
          if (available) setFailedUrl(url)
        }}
      />
      {!available && <span className="image-note">Illustrative image</span>}
    </div>
  )
}
