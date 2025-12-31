const fs = require('fs');
const path = require('path');

const weeksDir = path.join(__dirname, 'weeks');
const outputFile = path.join(__dirname, 'full-reading-plan.md');

// Read all markdown files from the weeks directory
const files = fs.readdirSync(weeksDir)
  .filter(file => file.endsWith('.md'));

// Sort by week number (extract number from beginning of filename)
files.sort((a, b) => {
  const numA = parseInt(a.split('-')[0], 10);
  const numB = parseInt(b.split('-')[0], 10);
  return numA - numB;
});

// Compile all weeks into one document
const compiledContent = files.map(file => {
  const filePath = path.join(weeksDir, file);
  return fs.readFileSync(filePath, 'utf-8').trim();
}).join('\n\n---\n\n');

// Write the compiled document
fs.writeFileSync(outputFile, compiledContent + '\n');

console.log(`✓ Compiled ${files.length} weeks into ${outputFile}`);

