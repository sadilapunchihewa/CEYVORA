import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import useWebsiteContent from '../../hooks/useWebsiteContent'
export default function PageMetadata() {
  const { pathname } = useLocation()
  const { items: journeys } = useWebsiteContent('journeys')
  const { items: experiences } = useWebsiteContent('experiences')
  useEffect(() => {
    const item = pathname.startsWith('/journeys/')
      ? journeys.find((x) => pathname === '/journeys/' + x.slug)
      : experiences.find((x) => pathname === '/experiences/' + x.slug)
    const title = item ? item.name + ' | Ceyvora' : document.title
    const description =
      item?.description ||
      'Explore Sri Lanka with Ceyvora: destination guides, journey ideas and experiences for your next trip.'
    const set = (key, value, property = false) => {
      let tag = document.head.querySelector(
        `meta[${property ? 'property' : 'name'}="${key}"]`,
      )
      if (!tag) {
        tag = document.createElement('meta')
        tag.setAttribute(property ? 'property' : 'name', key)
        document.head.appendChild(tag)
      }
      tag.content = value
    }
    if (item) document.title = title
    set('description', description)
    set('og:title', title, true)
    set('og:description', description, true)
    set('og:type', 'website', true)
    set('og:url', window.location.origin + pathname, true)
    set(
      'og:image',
      new URL(item?.image || '/images/sigiriya.webp', window.location.origin)
        .href,
      true,
    )
    set(
      'robots',
      /^\/(account|login|register)/.test(pathname)
        ? 'noindex, nofollow'
        : 'index, follow',
    )
    let canonical = document.head.querySelector('link[rel="canonical"]')
    if (!canonical) {
      canonical = document.createElement('link')
      canonical.rel = 'canonical'
      document.head.appendChild(canonical)
    }
    canonical.href = window.location.origin + pathname
  }, [pathname, journeys, experiences])
  return null
}
