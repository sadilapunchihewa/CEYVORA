import PageHeader from '../components/common/PageHeader'
import TravelFAQ from '../components/common/TravelFAQ'
export default function FAQPage() {
  return (
    <>
      <PageHeader
        eyebrow="Planning together"
        title="Your travel questions, answered."
        description="From your first idea to the details you should confirm before booking."
      />
      <TravelFAQ />
    </>
  )
}
