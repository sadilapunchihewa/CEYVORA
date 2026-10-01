import PageHeader from '../components/common/PageHeader'
import Button from '../components/common/Button'
export default function NotFoundPage() {
  return (
    <>
      <PageHeader
        eyebrow="404"
        title="Looks like this journey went off the map."
        description="The page may have moved or the address may be incomplete."
      />
      <section className="section container">
        <Button to="/">Back to home</Button>
      </section>
    </>
  )
}
