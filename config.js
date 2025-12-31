/**
 * Bible Reading Plan Configuration
 * 
 * Adjust these settings each year to align themed weeks with their holidays.
 */

module.exports = {
  // When does your reading plan year start?
  startDate: '2026-01-04', // First Sunday of 2026
  
  // Anchor specific weeks to calendar dates
  // The week containing this date will use the specified reading
  // Format: 'YYYY-MM-DD': 'filename-without-extension'
  anchors: {
    // Spring Feasts - week leading up to Passover 2026 (April 1-2 at sunset)
    '2026-03-29': '15-passover-and-the-spring-feasts',
    
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

