# Travel content notes

Updated 2026-10-02.

The eight journey plans are original Ceyvora editorial suggestions, not itineraries supplied by the reference operator. Durations, overnight bases and destination pairings are suggestions. No accommodation, departure, price or inclusion is guaranteed.

Seasonal background:
- Sri Lanka Tourism weather guide: https://www.srilanka.travel/weather
- Sri Lanka Tourism beaches: https://www.srilanka.travel/pristine-beach-holidays
- Sri Lanka Tourism cultural heritage: https://www.srilanka.travel/cultural_heritage

Destination content lives in src/data/destinationTips.js. Journey suggestions live in src/data/journeyPlans.js. FAQs live in src/components/common/TravelFAQ.jsx.

Before treating an idea as a saleable package, the operator must approve the route, travel times, hotels, transport, availability, itemised inclusions, price, payment terms and cancellation conditions. The FAQ intentionally directs travellers to their agreed quote rather than inventing these policies.

## Website content management
The public homepage, Tours and journey detail pages now use /api/content/journeys.
Admin > Website content edits journeys, experiences, destination tips, FAQs and contact details.
Published JSON is stored privately in backend/App_Data/WebsiteContent. Back up this folder and use a persistent writable volume when deploying. Seed content is in backend/Data/WebsiteContent.
The API supports one server process and optimistic version checks. For a multi-instance deployment, move the content store to the shared database.
Business fields are intentionally empty for this personal site. No SMTP emails are sent; enquiries remain in the database/admin panel.
With a real domain, set SITE_URL and run node frontend/scripts/generate-sitemap.mjs before the production build. Client-rendered metadata does not guarantee social crawler previews; prerendering is a separate deployment step.
Legacy database tour packages remain for existing bookings. Public journey inspiration is managed under Website content; do not edit legacy packages expecting those inspiration cards to change.
