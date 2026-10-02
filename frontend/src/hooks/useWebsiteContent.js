import { useCallback } from 'react'
import useResource from './useResource'
import api from '../api/axios'
export default function useWebsiteContent(section, fallback = []) {
  const loader = useCallback(
    (signal) =>
      api.get('/api/content/' + section, { signal }).then((r) => r.data),
    [section],
  )
  const resource = useResource(loader)
  return { ...resource, items: resource.data?.items ?? fallback }
}
