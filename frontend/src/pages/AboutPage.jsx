import InnerPageHero from '../components/common/InnerPageHero'
import WhyChooseUs from '../components/home/WhyChooseUs'
import CTASection from '../components/home/CTASection'
export default function AboutPage() {
  return (
    <>
      <InnerPageHero
        className="about-page-header"
        title="Discover Sri Lanka your way."
        description="Ceyvora brings the island’s places and journeys together, so your trip can begin with curiosity."
        eyebrow="The Ceyvora way"
        image="/images/destinations/wellawaya.jpg"
        imageAlt="Ancient rock carvings at Buduruwagala near Wellawaya"
        marker="OUR STORY · 03"
      />
      <section className="section container about-grid">
        <img
          src="/images/tea-picker.webp"
          alt="A tea picker harvesting fresh leaves in Sri Lanka"
          width="720"
          height="800"
          loading="lazy"
        />
        <div>
          <h2>
            Less rushing.
            <br />
            More being there.
          </h2>
          <p>
            A trip can be a long list of places. We’d like it to be something
            more personal: a morning in the hills, an unfamiliar flavour, a
            conversation you didn’t expect.
          </p>
          <p>
            Our approach starts with you. Explore the destinations and journeys
            here, then tell us what you’d like your time in Sri Lanka to feel
            like.
          </p>
          <h3>Room for your own rhythm</h3>
          <p>
            Culture, wildlife, coast or countryside: there’s no single way to
            experience the island. Use our tours as a starting point for a
            conversation about your plans.
          </p>
        </div>
      </section>
      <section className="about-story-band">
        <div className="container">
          <div className="about-story-copy">
            <span>How we travel</span>
            <h2>
              See the island.
              <br />
              Feel its rhythm.
            </h2>
            <p>
              We believe a route should connect more than landmarks. It should
              leave room for early markets, long train views, unplanned stops
              and the kind of conversations that never appear on an itinerary.
            </p>
          </div>
          <div className="about-story-images">
            <img
              src="/images/fort-walk.webp"
              alt="Travellers walking along the green ramparts of Galle Fort"
              width="720"
              height="900"
              loading="lazy"
            />
            <img
              src="/images/galle-lighthouse.webp"
              alt="Galle Lighthouse rising above tropical palm trees"
              width="720"
              height="900"
              loading="lazy"
            />
          </div>
        </div>
      </section>
      <WhyChooseUs />
      <CTASection />
    </>
  )
}
