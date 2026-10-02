import { useState } from 'react'
import { resolveImageUrl } from '../../utils/images'
export default function TravelImage({ path, alt, eager = false }) {
  const url = resolveImageUrl(path)
  const [failedUrl, setFailedUrl] = useState(null)
  if (!url || failedUrl === url)
    return (
      <div
        className="travel-image travel-image-unavailable"
        role="img"
        aria-label={alt + ' — photo unavailable'}
      >
        <span>{alt}</span>
      </div>
    )
  return (
    <div className="travel-image">
      <img
        src={url}
        alt={alt}
        loading={eager ? 'eager' : 'lazy'}
        fetchPriority={eager ? 'high' : undefined}
        width="640"
        height="440"
        onError={() => setFailedUrl(url)}
      />
    </div>
  )
}
