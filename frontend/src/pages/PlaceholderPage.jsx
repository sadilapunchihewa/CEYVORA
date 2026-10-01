import PageHeader from '../components/common/PageHeader'
import Button from '../components/common/Button'
export default function PlaceholderPage({ login = false }) {
  return (
    <>
      <PageHeader
        title={
          login
            ? 'Your next chapter is coming.'
            : 'Let’s talk about this journey.'
        }
        description={
          login
            ? 'Customer accounts will be available in a later release. You can explore and enquire without signing in.'
            : 'Full itinerary pages are coming soon. Contact us to discuss this tour and your travel plans.'
        }
      />
      <section className="section container button-row">
        <Button to={login ? '/tours' : '/contact'}>
          {login ? 'Explore tours' : 'Enquire about a journey'}
        </Button>
        <Button to={login ? '/' : '/tours'} variant="outline">
          {login ? 'Back to home' : 'Back to tours'}
        </Button>
      </section>
    </>
  )
}
