const regions = {
  coast: {
    season:
      'The southwest coast generally has more settled beach weather from November to March. Rain and sea conditions still vary; choose water activities locally.',
    access:
      'Plan road transfers along the coast. Some towns also have rail connections; check the current timetable and your final transfer to the stay.',
    packing:
      'Bring sun protection, light clothes and a reusable water bottle. Follow local guidance about swimming conditions.',
  },
  east: {
    season:
      'The east coast is often a better beach choice during the southwest monsoon. Check the forecast and local sea conditions for your exact dates.',
    access:
      'Allow a substantial road-transfer day from Colombo or the central hills. An overnight cultural stop can break up the journey.',
    packing:
      'Bring sun protection and leave room for quiet afternoons. Check boat and swimming conditions on the day.',
  },
  hills: {
    season:
      'Expect cooler air and changeable weather in the hills. Keep walking plans flexible and check the forecast before setting out.',
    access:
      'Mountain roads take time. Discuss road transfers and any rail segment separately, including station transfers and seat availability.',
    packing:
      'Bring a light warm layer, rain protection and shoes with grip. Start walks with enough daylight for the return.',
  },
  culture: {
    season:
      'Plan outdoor sightseeing early in the day to avoid the strongest heat. Leave flexibility for rain and local festival crowds.',
    access:
      'Use a road base that suits the places you want to combine. Ask about a driver or local transport between widely spaced sites.',
    packing:
      'Bring water and footwear that is easy to remove. Cover shoulders and knees at sacred sites and follow photography notices.',
  },
  nature: {
    season:
      'Outdoor access and wildlife activity vary with rain and local conditions. Confirm park or trail access close to your visit.',
    access:
      'Arrange the last leg to your lodge or entrance in advance. Park vehicles, guides and entry arrangements should be confirmed separately.',
    packing:
      'Bring closed shoes, rain protection and binoculars if you have them. Keep a respectful distance from wildlife and avoid feeding animals.',
  },
}

// Durations and pairings are editorial planning suggestions, not fixed travel schedules.
const places = {
  anuradhapura: ['culture', '2 nights', 'Mihintale and the ancient city'],
  'arugam-bay': ['east', '3 nights', 'Coastal villages and lagoon landscapes'],
  bentota: ['coast', '2–3 nights', 'Gardens and the southwest coast'],
  colombo: ['culture', '1–2 nights', 'Pettah, city museums and the waterfront'],
  dambulla: ['culture', '1–2 nights', 'Sigiriya and Habarana'],
  ella: ['hills', '2–3 nights', 'Hill walks and the Nine Arch Bridge area'],
  galle: ['coast', '2 nights', 'Galle Fort and Unawatuna'],
  habarana: ['culture', '2–3 nights', 'Dambulla, Sigiriya and Polonnaruwa'],
  hatton: ['hills', '2 nights', 'Tea-country walks and reservoir scenery'],
  hikkaduwa: ['coast', '2–3 nights', 'Galle and the southwest coast'],
  jaffna: [
    'culture',
    '2–3 nights',
    'The peninsula’s cultural places and coastal landscapes',
  ],
  kalpitiya: ['coast', '2–3 nights', 'Lagoon scenery and the northwest coast'],
  kandy: [
    'hills',
    '2 nights',
    'The Temple of the Tooth and Peradeniya gardens',
  ],
  kitulgala: ['nature', '1–2 nights', 'River activities and forest walks'],
  mirissa: ['coast', '2–3 nights', 'Weligama and the south coast'],
  negombo: ['coast', '1–2 nights', 'Lagoon scenery and west-coast life'],
  'nuwara-eliya': [
    'hills',
    '2 nights',
    'Tea landscapes and hill-country gardens',
  ],
  passikudah: ['east', '3 nights', 'Nearby Kalkudah and east-coast time'],
  polonnaruwa: ['culture', '1–2 nights', 'The ancient city and Habarana'],
  sigiriya: ['culture', '2 nights', 'Dambulla and Pidurangala'],
  sinharaja: [
    'nature',
    '2 nights',
    'Guided rainforest walks from your chosen entrance',
  ],
  tangalle: ['coast', '2–3 nights', 'The quieter stretches of the south coast'],
  trincomalee: ['east', '3 nights', 'The town’s cultural places and Nilaveli'],
  udawalawe: [
    'nature',
    '1–2 nights',
    'A park visit between the hills and south coast',
  ],
  unawatuna: ['coast', '2–3 nights', 'Galle Fort and nearby coastal walks'],
  weligama: ['coast', '2–3 nights', 'Mirissa and Galle'],
  wellawaya: [
    'culture',
    '1–2 nights',
    'Buduruwagala and the route towards Ella',
  ],
  wilpattu: ['nature', '2 nights', 'A park visit combined with Anuradhapura'],
  yala: ['nature', '2 nights', 'A park visit and the southeast coast'],
}

export function getDestinationTips(slug) {
  const entry = places[slug]
  if (!entry) return null
  const [region, stay, nearby] = entry
  return { ...regions[region], stay, nearby }
}
