import useWebsiteContent from '../../hooks/useWebsiteContent'
import { Link } from 'react-router-dom'

const questions = [
  [
    'Can I change a journey to suit my interests?',
    'Use any journey idea as a starting point. In your enquiry, mention the places you want to see, your pace, travel dates and budget. The route and arrangements need to be agreed before you book.',
  ],
  [
    'What should I include in my enquiry?',
    'Share your approximate dates, number of adults and children, preferred room arrangements, interests and budget with its currency. Mention mobility needs or dietary requirements that could affect the plan. You do not need a finished itinerary.',
  ],
  [
    'Does sending an enquiry confirm a booking?',
    'No. An enquiry starts a planning conversation; it does not reserve rooms, transport or activities, and it does not take a payment. Ask for written confirmation of availability and the final arrangements before committing.',
  ],
  [
    'Are hotels, transport and entry tickets included?',
    'Journey ideas do not have automatic inclusions. Request an itemised quote covering accommodation, room type, meals, transport, guiding, entry tickets and any optional activities. Only the agreed quote should determine what is included.',
  ],
  [
    'How do payment and cancellation work?',
    'Request the payment schedule, accepted payment methods, cancellation charges and refund conditions with your quote. These depend on the agreed arrangements; no standard deposit or free-cancellation promise is made on these inspiration pages.',
  ],
  [
    'Can I travel with children or at a slower pace?',
    'Include children’s ages and your preferred daily pace in the enquiry. Ask about shorter transfers, rest days, room layouts, child seats and step-free access where needed. Suitability should be checked for each stay and activity.',
  ],
  [
    'Will train rides, safaris and water activities be available?',
    'These need separate availability checks. Train seats can sell out, wildlife sightings vary, and outdoor activities depend on weather and local conditions. Ask what alternatives can be offered before finalising the route.',
  ],
]

export default function TravelFAQ() {
  const { items } = useWebsiteContent(
    'faq',
    questions.map(([question, answer], i) => ({
      slug: String(i),
      question,
      answer,
    })),
  )
  return (
    <section
      className="section container travel-faq"
      id="travel-faq"
      aria-labelledby="travel-faq-heading"
    >
      <div>
        <p className="directory-region">Before you set off</p>
        <h2 id="travel-faq-heading">
          A little clarity.
          <br />A better journey.
        </h2>
        <p>Useful answers while you shape your Sri Lanka trip.</p>
        <Link to="/contact">Ask about your plans →</Link>
      </div>
      <div>
        {items.map(({ question, answer }) => (
          <details key={question}>
            <summary>{question}</summary>
            <p>{answer}</p>
          </details>
        ))}
      </div>
    </section>
  )
}
