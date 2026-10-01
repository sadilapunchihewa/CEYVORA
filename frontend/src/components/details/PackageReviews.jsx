export default function PackageReviews({ reviews = [] }) {
  const approved = reviews
    .filter((review) => review.isApproved)
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
  return (
    <section className="detail-section" aria-labelledby="reviews-heading">
      <h2 id="reviews-heading">Traveller reviews</h2>
      {approved.length ? (
        <div className="package-reviews">
          {approved.map((review) => {
            const rating = Math.max(0, Math.min(5, Number(review.rating) || 0))
            const date = new Date(review.createdAt)
            return (
              <article className="package-review" key={review.id}>
                <div className="review-byline">
                  <h3>{review.customerName}</h3>
                  {Number.isFinite(date.getTime()) && (
                    <time dateTime={date.toISOString()}>
                      {date.toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        timeZone: 'UTC',
                      })}
                    </time>
                  )}
                </div>
                <p className="stars" aria-label={rating + ' out of 5 stars'}>
                  <span aria-hidden="true">
                    {'★'.repeat(rating)}
                    {'☆'.repeat(5 - rating)}
                  </span>
                </p>
                <p className="preserve-lines">{review.comment}</p>
              </article>
            )
          })}
        </div>
      ) : (
        <div className="detail-empty">
          <p>
            No approved reviews yet. Travellers’ published stories will appear
            here.
          </p>
        </div>
      )}
    </section>
  )
}
