import useResource from '../hooks/useResource'
import { getFeaturedDestinations } from '../services/destinationService'
import { getFeaturedTourPackages } from '../services/tourPackageService'
import HeroSection from '../components/home/HeroSection'
import FeaturedDestinations from '../components/home/FeaturedDestinations'
import FeaturedTours from '../components/home/FeaturedTours'
import WhyChooseUs from '../components/home/WhyChooseUs'
import TravelExperience from '../components/home/TravelExperience'
import TestimonialsSection from '../components/home/TestimonialsSection'
import CTASection from '../components/home/CTASection'
import IslandIntro from '../components/home/IslandIntro'
import StoryBreak from '../components/home/StoryBreak'
import SriLankaStories from '../components/home/SriLankaStories'
export default function HomePage() {
  const destinations = useResource(getFeaturedDestinations)
  const tours = useResource(getFeaturedTourPackages)
  return (
    <>
      <HeroSection />
      <IslandIntro />
      <FeaturedDestinations resource={destinations} />
      <StoryBreak />
      <FeaturedTours resource={tours} />
      <WhyChooseUs />
      <TravelExperience />
      <SriLankaStories />
      <TestimonialsSection tours={tours} />
      <CTASection />
    </>
  )
}
