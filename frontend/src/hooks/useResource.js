import { useEffect, useState, useCallback } from 'react'
// The loader must be stable; cancellation prevents stale data after navigation.
export default function useResource(loader) {
  const [attempt, setAttempt] = useState(0)
  const [state, setState] = useState({
    data: null,
    loading: true,
    error: false,
    loader: null,
    attempt: -1,
  })
  useEffect(() => {
    const controller = new AbortController()
    Promise.resolve()
      .then(() => loader(controller.signal))
      .then((data) => {
        if (!controller.signal.aborted)
          setState({ data, loading: false, error: false, loader, attempt })
      })
      .catch((error) => {
        if (!controller.signal.aborted)
          setState({
            data: null,
            loading: false,
            error: true,
            status: error.response?.status,
            loader,
            attempt,
          })
      })
    return () => controller.abort()
  }, [loader, attempt])
  const retry = useCallback(() => setAttempt((value) => value + 1), [])
  return state.loader === loader && state.attempt === attempt
    ? { ...state, retry }
    : { data: null, loading: true, error: false, retry }
}
