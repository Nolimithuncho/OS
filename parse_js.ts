import fs from 'fs';

const content = fs.readFileSync('downloaded_js.js', 'utf-8');

// Let's find essays or main text blocks. Look for paragraphs that have some of the headers.
console.log("Length of js file:", content.length);

// Let's search for some titles and find where they are in the file.
const titles = [
  "Twenty-Naira Access",
  "Meeting that Decided a Life",
  "Standardizing National Biometrics",
  "Birth of a New National Standard",
  "Transparency Through System Architecture",
  "Rebuilding the Pact with Citizens",
  "Strategic Integration of Public Data",
  "Governance Takeaway",
  "Three Pillars of Lasting Institutions",
  "Call for Strategic Building",
  "Modernizing terminal hubs",
  "Elevating Nigeria's Skies",
  "Participatory Democracy Framework",
  "Moving Towards Responsive States"
];

for (const t of titles) {
  const index = content.indexOf(t);
  console.log(`Title "${t}": primitive index = ${index}`);
}

// Let's extract any array of articles or objects.
// Often data is stored in objects like { title: "...", content: "..." }
// Let's search for occurrences of text that looks like JSON or template literals.
// Let's search for "title:" or "date:" or "content:" or "slug:" or "category:" in the file.
const regex = /{title:.*?}/g;
const matches = content.match(regex);
console.log("Match count for {title: }: ", matches ? matches.length : 0);
