import JourneyProcess from '../components/common/JourneyProcess'
import TravelFAQ from '../components/common/TravelFAQ'
import InnerPageHero from '../components/common/InnerPageHero'
import TourIdeas from '../components/browse/TourIdeas'
import CTASection from '../components/home/CTASection'

export default function ToursPage() {
  return (
    <>
      <InnerPageHero
        eyebrow="Journeys by Ceyvora"
        title="A journey to call your own."
        description="Unhurried days. Extraordinary places. Your Sri Lankan story."
        image="/images/destinations/unawatuna.jpg"
        imageAlt="Turquoise waves meeting the palm-fringed beach at Unawatuna"
        href="#tour-ideas"
        linkText="Find your journey"
      />
      <TourIdeas />
      <JourneyProcess />
      <CTASection />
      <TravelFAQ />
    </>
  )
}
