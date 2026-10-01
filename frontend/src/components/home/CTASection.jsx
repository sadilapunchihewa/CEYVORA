import Button from '../common/Button'
export default function CTASection() {
  return (
    <section className="cta-section">
      <img
        className="cta-background"
        src="/images/beach.webp"
        alt=""
        width="1920"
        height="1080"
        loading="lazy"
      />
      <div className="container cta-inner">
        <div>
          <span>Your story</span>
          <h2>Starts here.</h2>
          <p>Let’s create a Sri Lankan journey that’s entirely yours.</p>
        </div>
        <Button to="/contact" variant="sand">
          Plan your journey
        </Button>
      </div>
    </section>
  )
}
