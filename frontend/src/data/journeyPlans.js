// Original suggested routes; these are not contracted packages or fixed departures.
const plans = {
  'courtyards-verandahs': [
    'Architecture, gardens and time to linger',
    ['colombo', 'bentota', 'bentota', 'galle', 'galle', 'colombo'],
    'Choose small heritage stays and allow time for gardens and architectural visits. Confirm opening arrangements before adding private properties to the itinerary.',
  ],
  'cycling-in-sri-lanka-tour': [
    'Village roads at your own pace',
    [
      'negombo',
      'sigiriya',
      'sigiriya',
      'polonnaruwa',
      'kandy',
      'kandy',
      'colombo',
    ],
    'Discuss daily distances, elevation, bicycle fit, helmets and support transport. Cycling sections should be chosen with a local operator around your fitness and road conditions.',
  ],
  'everlasting-summer-in-lanka': [
    'Gardens, hill air and the coast',
    [
      'colombo',
      'kandy',
      'kandy',
      'nuwara-eliya',
      'nuwara-eliya',
      'bentota',
      'bentota',
      'colombo',
    ],
    'Leave a full transfer day between the hills and coast. Ask for garden visits and restful afternoons rather than filling every day with excursions.',
  ],
  'experiential-east': [
    'Culture followed by coastal days',
    [
      'colombo',
      'sigiriya',
      'polonnaruwa',
      'trincomalee',
      'trincomalee',
      'passikudah',
      'passikudah',
      'colombo',
    ],
    'Build in a full final travel day from the east. Choose water activities locally according to sea conditions, and discuss whether an extra overnight stop would suit your departure.',
  ],
  'fabulous-sri-lanka': [
    'A shared introduction to the island',
    [
      'negombo',
      'sigiriya',
      'sigiriya',
      'kandy',
      'nuwara-eliya',
      'ella',
      'udawalawe',
      'galle',
      'colombo',
    ],
    'This is an idea for travelling together, not a scheduled group departure. Ask about group size, room sharing, departure dates and whether a private version is available.',
  ],
  'love-songs-of-ceylon': [
    'Room for two, and room to slow down',
    ['negombo', 'kandy', 'hatton', 'hatton', 'bentota', 'bentota', 'colombo'],
    'Prioritise fewer hotel changes, private time and a room style you both enjoy. Special meals, room upgrades and celebrations need separate confirmation.',
  ],
  'meditation-yoga': [
    'A gentler rhythm',
    ['colombo', 'kandy', 'kandy', 'kandy', 'bentota', 'bentota', 'colombo'],
    'Discuss instructor availability, experience level and your preferred session length before choosing a stay. Sessions are optional planning ideas, not included treatments or guaranteed activities.',
  ],
  'scenic-sri-lanka': [
    'From ancient landscapes to the ocean',
    [
      'negombo',
      'sigiriya',
      'kandy',
      'nuwara-eliya',
      'ella',
      'ella',
      'udawalawe',
      'galle',
      'colombo',
    ],
    'Allow breathing room for viewpoints and changing weather. A hill-country rail segment can be discussed, with road travel as an alternative if suitable seats are unavailable.',
  ],
}

export const placeNotes = {
  colombo: [
    'Colombo',
    'Explore the city at a comfortable pace, with time for a neighbourhood walk and a meal before your onward journey.',
  ],
  negombo: [
    'Negombo',
    'Settle in near the west coast. Keep the first day light and adjust plans around your arrival time.',
  ],
  bentota: [
    'Bentota',
    'Leave time for the coast and a garden visit; arrange activities separately according to availability and sea conditions.',
  ],
  galle: [
    'Galle',
    'Explore the fort streets on foot and leave the warmer part of the day free for a long lunch or rest.',
  ],
  sigiriya: [
    'Sigiriya',
    'Plan an early cultural visit and an unhurried afternoon. Discuss climbing requirements and alternatives before travelling.',
  ],
  polonnaruwa: [
    'Polonnaruwa',
    'Give the ancient city time rather than treating it as a quick stop. Choose walking, cycling or vehicle-supported visits to suit your group.',
  ],
  kandy: [
    'Kandy',
    'Combine the city’s cultural places with garden time. Keep shoulders and knees covered for temple visits.',
  ],
  'nuwara-eliya': [
    'Nuwara Eliya',
    'Spend time among hill-country scenery and tea landscapes. Bring a layer for cooler evenings and allow for rain.',
  ],
  ella: [
    'Ella',
    'Leave room for hill views and a walk suited to your ability. Ask locally about current trail and weather conditions.',
  ],
  hatton: [
    'Hatton',
    'Slow down among tea-country scenery, with a relaxed walk and time at your chosen stay.',
  ],
  trincomalee: [
    'Trincomalee',
    'Balance coastal time with a cultural visit. Choose any boat or water activity after checking local conditions.',
  ],
  passikudah: [
    'Passikudah',
    'Keep a relaxed beach day in the plan. Swimming and excursions depend on conditions on the day.',
  ],
  udawalawe: [
    'Udawalawe',
    'Discuss a park visit with an authorised operator. Entry, a safari vehicle and guiding must be confirmed; wildlife sightings are never guaranteed.',
  ],
}

export function getJourneyPlan(slug) {
  const plan = plans[slug]
  if (!plan) return null
  const [heading, route, advice] = plan
  return { heading, route, advice, nights: route.length - 1 }
}
