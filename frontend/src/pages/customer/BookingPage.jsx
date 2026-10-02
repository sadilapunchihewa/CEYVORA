import { Navigate, useParams } from 'react-router-dom'

// Preserve old tour booking links while routing new requests through enquiries.
export default function BookingPage() {
  const { slug } = useParams()
  return (
    <Navigate replace to={'/contact?package=' + encodeURIComponent(slug)} />
  )
}
