export const enquiryStages = {
  New: 'New request',
  InProgress: 'Reviewing itinerary',
  Contacted: 'Traveller contacted',
  QuoteSent: 'Quote sent',
  Confirmed: 'Traveller confirmed',
  Resolved: 'Resolved',
  Closed: 'Closed',
}
export function enquiryInterest(enquiry) {
  if (enquiry.tourPackageId) return `Tour #${enquiry.tourPackageId}`
  return enquiry.message?.split('\n')[0]?.slice(0, 130) || 'General enquiry'
}
