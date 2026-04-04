/**
 * Bible Reading Plan Configuration
 * 
 * Adjust these settings each year to align themed weeks with their holidays.
 */

module.exports = {
  // When does your reading plan year start?
  startDate: '2026-01-04', // First Sunday of 2026
  
  // Anchor specific weeks to calendar dates
  // The week containing this date will use the specified reading.
  // Prep-week rule: use the Sunday before the Saturday immediately preceding the holy day.
  // Format: 'YYYY-MM-DD': 'filename-without-extension'
  anchors: {
    // Passover prep week for teaching on the prior Saturday (holy day: April 1-2 at sunset)
    '2026-03-22': '8-passover-and-the-spring-feasts',

    // Preparation week right before Pentecost 2026 (May 24)
    '2026-05-17': '20-preparation-for-pentecost',
    
    // Trumpets prep week for teaching on the prior Saturday (holy day: Sept 11-12 at sunset)
    '2026-08-30': '35-preparation-for-trumpets',

    // Fall Feasts - week leading up to Feast of Trumpets 2026 (Sept 11-12 at sunset)
    '2026-09-06': '39-trumpets-and-the-fall-feasts',
  },
  
  // Optional: manually set the full week order (overrides anchors if provided)
  // Uncomment and customize if you want complete control
  // weekOrder: [
  //   '1-creation-fall-and-redemption',
  //   '2-covenants-of-god-with-humanity',
  //   // ... all 52 weeks in your desired order
  // ],
};


