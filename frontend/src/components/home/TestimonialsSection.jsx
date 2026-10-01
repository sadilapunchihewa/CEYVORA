import { useCallback } from 'react'
import useResource from '../../hooks/useResource'
import { getPackageReviews } from '../../services/reviewService'
import ResourceState from '../common/ResourceState'
import SectionTitle from '../common/SectionTitle'
function Reviews({ tours }) {
  const ids = tours
    .slice(0, 3)
    .map((tour) => tour.id)
    .join(',')
  const load = useCallback(
    async (signal) => {
      if (!ids) return []
      const groups = await Promise.all(
        ids.split(',').map((id) => getPackageReviews(id, signal)),
      )
      return groups
        .flat()
        .filter((review) => review.isApproved)
        .slice(0, 3)
    },
    [ids],
  )
  const reviews = useResource(load)
  return (
    <ResourceState resource={reviews} name="traveller stories">
      <div className="review-grid">
        {reviews.data?.length ? (
          reviews.data.map((review) => (
            <figure className="review" key={review.id}>
              <p
                aria-label={review.rating + ' out of 5 stars'}
                className="stars"
              >
                {'★'.repeat(Math.max(0, Math.min(5, review.rating)))}
              </p>
              <blockquote>{review.comment}</blockquote>
              <figcaption>{review.customerName}</figcaption>
            </figure>
          ))
        ) : (
          <div className="stories-empty">
            <h3>Every journey has a story.</h3>
            <p>
              There are no published reviews for these journeys yet. We’ll share
              travellers’ approved stories here as they arrive.
            </p>
          </div>
        )}
      </div>
    </ResourceState>
  )
}
export default function TestimonialsSection({ tours }) {
  return (
    <section className="section container stories">
      <SectionTitle
        title="Stories from the journey"
        description="In the words of the people who travelled."
      />
      {tours.loading || tours.error ? (
        <ResourceState resource={tours} name="traveller stories" />
      ) : (
        <Reviews tours={tours.data || []} />
      )}
    </section>
  )
}
