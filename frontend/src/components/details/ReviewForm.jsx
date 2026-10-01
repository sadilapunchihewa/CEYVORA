import { useRef, useState } from 'react'
import { useAuth } from '../../context/authContextValue'
import { createReview } from '../../services/reviewService'
import { requestError } from '../../utils/customer'
import Button from '../common/Button'
export default function ReviewForm({ tourPackageId }) {
  const { user } = useAuth()
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState('')
  const [success, setSuccess] = useState(false)
  const busy = useRef(false)
  if (user?.role !== 'Customer') return null
  async function submit(event) {
    event.preventDefault()
    if (busy.current) return
    const form = event.currentTarget
    const data = Object.fromEntries(new FormData(form))
    if (data.comment.trim().length < 3) {
      setMessage('Write at least 3 characters about your experience.')
      form.elements.comment.focus()
      return
    }
    busy.current = true
    setPending(true)
    setMessage('')
    try {
      await createReview({
        tourPackageId,
        rating: Number(data.rating),
        comment: data.comment.trim(),
      })
      form.reset()
      setSuccess(true)
    } catch (error) {
      setMessage(
        requestError(
          error,
          'We couldn’t submit your review right now. Please try again.',
        ),
      )
    } finally {
      busy.current = false
      setPending(false)
    }
  }
  return (
    <section className="detail-section review-form">
      <h2>Write a review</h2>
      {success ? (
        <p role="status">
          Thank you. Your review has been submitted for approval.
        </p>
      ) : (
        <>
          <p>
            Share your experience of this journey. Reviews appear after
            approval.
          </p>
          <form onSubmit={submit} className="customer-form">
            <div className="customer-field">
              <label htmlFor="rating">Your rating</label>
              <select id="rating" name="rating" defaultValue="5">
                {[5, 4, 3, 2, 1].map((value) => (
                  <option value={value} key={value}>
                    {value} {value === 1 ? 'star' : 'stars'}
                  </option>
                ))}
              </select>
            </div>
            <div className="customer-field">
              <label htmlFor="comment">Your review</label>
              <textarea
                id="comment"
                name="comment"
                minLength={3}
                maxLength={3000}
                rows="5"
                required
              />
            </div>
            {message && (
              <p role="alert" className="form-message">
                {message}
              </p>
            )}
            <Button disabled={pending} type="submit">
              {pending ? 'Submitting…' : 'Submit review'}
            </Button>
          </form>
        </>
      )}
    </section>
  )
}
