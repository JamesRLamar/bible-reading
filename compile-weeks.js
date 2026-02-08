const fs = require('fs');
const path = require('path');

const weeksDir = path.join(__dirname, 'weeks');
const outputFile = path.join(__dirname, 'full-reading-plan.md');
const config = require('./config.js');

// Read all markdown files from the weeks directory
const allFiles = fs.readdirSync(weeksDir)
  .filter(file => file.endsWith('.md'))
  .map(file => file.replace('.md', ''));

// Sort by week number for default ordering
const sortByWeekNum = (a, b) => {
  const numA = parseInt(a.split('-')[0], 10);
  const numB = parseInt(b.split('-')[0], 10);
  return numA - numB;
};

allFiles.sort(sortByWeekNum);

/**
 * Calculate which week number a date falls into (1-indexed)
 */
const MS_PER_DAY = 24 * 60 * 60 * 1000;

function toUtcDayNumber(dateStr) {
  // dateStr is YYYY-MM-DD.
  // Use a UTC day number to avoid timezone + DST shifting.
  const [y, m, d] = dateStr.split('-').map(Number);
  return Math.floor(Date.UTC(y, m - 1, d) / MS_PER_DAY);
}

function getWeekNumber(startDate, targetDate) {
  const startDay = toUtcDayNumber(startDate);
  const targetDay = toUtcDayNumber(targetDate);
  const diffDays = targetDay - startDay;
  return Math.floor(diffDays / 7) + 1;
}

/**
 * Build the week order based on config
 */
function buildWeekOrder() {
  // If manual order is specified, use it
  if (config.weekOrder && config.weekOrder.length === 52) {
    console.log('Using manual week order from config');
    return config.weekOrder;
  }

  // Start with empty slots for 52 weeks
  const orderedWeeks = new Array(52).fill(null);
  const usedFiles = new Set();

  // Place anchored weeks first
  if (config.anchors) {
    for (const [date, filename] of Object.entries(config.anchors)) {
      const weekNum = getWeekNumber(config.startDate, date);
      
      if (weekNum < 1 || weekNum > 52) {
        console.warn(`⚠ Anchor date ${date} falls outside the 52-week range (week ${weekNum})`);
        continue;
      }

      if (!allFiles.includes(filename)) {
        console.warn(`⚠ Anchored file not found: ${filename}`);
        continue;
      }

      if (orderedWeeks[weekNum - 1] !== null) {
        console.warn(`⚠ Week ${weekNum} already has an anchor, skipping ${filename}`);
        continue;
      }

      orderedWeeks[weekNum - 1] = filename;
      usedFiles.add(filename);
      console.log(`📌 Week ${weekNum}: ${filename} (anchored to ${date})`);
    }
  }

  // Fill remaining slots with unanchored weeks in their natural order
  const remainingFiles = allFiles.filter(f => !usedFiles.has(f));
  let remainingIndex = 0;

  for (let i = 0; i < 52; i++) {
    if (orderedWeeks[i] === null && remainingIndex < remainingFiles.length) {
      orderedWeeks[i] = remainingFiles[remainingIndex];
      remainingIndex++;
    }
  }

  return orderedWeeks.filter(w => w !== null);
}

// Build the ordered week list
const weekOrder = buildWeekOrder();

// Compile all weeks into one document
const compiledContent = weekOrder.map((filename, index) => {
  const filePath = path.join(weeksDir, filename + '.md');
  let content = fs.readFileSync(filePath, 'utf-8').trim();
  
  // Calculate the date for this week
  const startDay = toUtcDayNumber(config.startDate);
  const weekDay = startDay + (index * 7);
  const weekDate = new Date(weekDay * MS_PER_DAY);
  const dateStr = weekDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
  
  // Insert the date into the week heading (## Title -> ## Title (Jan 4))
  // Match the first ## heading and append the date
  content = content.replace(/^(## .+?)(\s*)$/m, `$1 (${dateStr})$2`);
  
  return content;
}).join('\n\n');

// Add header with config info (as a comment at the top)
const header = `<!-- Bible Reading Plan ${config.startDate.slice(0, 4)} | Start: ${config.startDate} | Regenerate: node compile-weeks.js -->\n\n`;

// Write the compiled document
fs.writeFileSync(outputFile, header + compiledContent + '\n');

console.log(`\n✓ Compiled ${weekOrder.length} weeks into ${outputFile}`);
console.log(`  Start date: ${config.startDate}`);
console.log(`  Anchored weeks: ${Object.keys(config.anchors || {}).length}`);
