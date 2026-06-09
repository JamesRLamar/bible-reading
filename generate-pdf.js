const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const inputFile = path.join(__dirname, 'full-reading-plan.md');
const outputFile = path.join(__dirname, 'full-reading-plan.pdf');
const htmlFile = path.join(__dirname, 'full-reading-plan.html');

const CHROME_PATHS = [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
];

function findChrome() {
  for (const chromePath of CHROME_PATHS) {
    if (fs.existsSync(chromePath)) return chromePath;
  }
  return null;
}

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function markdownToHtml(markdown) {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const parts = [];
  let inBlockquote = false;

  const closeBlockquote = () => {
    if (inBlockquote) {
      parts.push('</blockquote>');
      inBlockquote = false;
    }
  };

  for (const line of lines) {
    if (line.startsWith('## ')) {
      closeBlockquote();
      parts.push(`<h2>${escapeHtml(line.slice(3).trim())}</h2>`);
      continue;
    }

    if (line.startsWith('### ')) {
      closeBlockquote();
      parts.push(`<h3>${escapeHtml(line.slice(4).trim())}</h3>`);
      continue;
    }

    const quoteMatch = line.match(/^>\s*"?(.+?)"?\s*(\([^)]+\))?\s*$/);
    if (quoteMatch) {
      if (!inBlockquote) {
        parts.push('<blockquote>');
        inBlockquote = true;
      }
      const text = quoteMatch[1].trim();
      const ref = quoteMatch[2] ? ` <cite>${escapeHtml(quoteMatch[2])}</cite>` : '';
      parts.push(`<p>&ldquo;${escapeHtml(text)}&rdquo;${ref}</p>`);
      continue;
    }

    const linkMatch = line.match(/^\s*\[Read ([^\]]+)\]\(([^)]+)\)\s*$/);
    if (linkMatch) {
      closeBlockquote();
      parts.push(
        `<p class="read-link"><a href="${escapeHtml(linkMatch[2])}">Read ${escapeHtml(linkMatch[1])}</a></p>`
      );
      continue;
    }

    if (line.trim() === '') {
      closeBlockquote();
      continue;
    }

    closeBlockquote();
    parts.push(`<p>${escapeHtml(line.trim())}</p>`);
  }

  closeBlockquote();
  return parts.join('\n');
}

function buildHtmlDocument(bodyHtml, year) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Bible Reading Plan ${year}</title>
  <style>
    @page {
      margin: 0.75in 0.85in;
    }

    body {
      font-family: "Iowan Old Style", "Palatino Linotype", Palatino, Georgia, serif;
      font-size: 11pt;
      line-height: 1.45;
      color: #1f1f1f;
      max-width: 7in;
      margin: 0 auto;
    }

    h2 {
      font-size: 16pt;
      margin: 1.4em 0 0.35em;
      padding-top: 0.4em;
      border-top: 1px solid #d8d8d8;
      page-break-after: avoid;
      break-after: avoid;
    }

    h2:first-of-type {
      border-top: none;
      margin-top: 0;
    }

    h3 {
      font-size: 12pt;
      margin: 1em 0 0.2em;
      page-break-after: avoid;
      break-after: avoid;
    }

    p {
      margin: 0.25em 0 0.55em;
    }

    blockquote {
      margin: 0.35em 0 0.55em 1em;
      padding-left: 0.75em;
      border-left: 3px solid #c9b88a;
      color: #3a3a3a;
      font-style: italic;
    }

    blockquote p {
      margin: 0;
    }

    blockquote cite {
      font-style: normal;
      font-size: 0.95em;
      color: #555;
    }

    .read-link {
      margin-top: 0;
      font-size: 10pt;
    }

    .read-link a {
      color: #5a4a2a;
      text-decoration: none;
    }

    .title-page {
      text-align: center;
      padding: 2.5in 0 1.5in;
      page-break-after: always;
      break-after: page;
    }

    .title-page h1 {
      font-size: 28pt;
      margin: 0 0 0.35em;
      font-weight: normal;
      letter-spacing: 0.02em;
    }

    .title-page p {
      font-size: 12pt;
      color: #555;
      margin: 0.2em 0;
    }
  </style>
</head>
<body>
  <section class="title-page">
    <h1>Bible Reading Plan</h1>
    <p>${year}</p>
    <p>52 weeks &middot; Daily readings in canonical order</p>
  </section>
  ${bodyHtml}
</body>
</html>`;
}

function extractYear(markdown) {
  const match = markdown.match(/Bible Reading Plan (\d{4})/);
  return match ? match[1] : new Date().getFullYear().toString();
}

function main() {
  if (!fs.existsSync(inputFile)) {
    console.error(`Missing ${inputFile}. Run: node compile-weeks.js`);
    process.exit(1);
  }

  const chrome = findChrome();
  if (!chrome) {
    console.error('Chrome/Chromium not found. Install Google Chrome to generate PDFs.');
    process.exit(1);
  }

  const markdown = fs.readFileSync(inputFile, 'utf-8')
    .replace(/^<!--[\s\S]*?-->\s*/m, '')
    .trim();

  const year = extractYear(fs.readFileSync(inputFile, 'utf-8'));
  const html = buildHtmlDocument(markdownToHtml(markdown), year);
  fs.writeFileSync(htmlFile, html);

  if (fs.existsSync(outputFile)) {
    fs.unlinkSync(outputFile);
  }

  execFileSync(chrome, [
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--run-all-compositor-stages-before-draw',
    '--virtual-time-budget=10000',
    `--print-to-pdf=${outputFile}`,
    `file://${htmlFile}`,
  ], { stdio: 'inherit' });

  if (!fs.existsSync(outputFile)) {
    console.error('PDF generation failed.');
    process.exit(1);
  }

  const sizeKb = Math.round(fs.statSync(outputFile).size / 1024);
  console.log(`✓ Generated ${outputFile} (${sizeKb} KB)`);
}

main();
